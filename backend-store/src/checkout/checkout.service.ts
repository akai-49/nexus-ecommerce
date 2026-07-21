import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { PaymentFactory } from '../payments/payment.factory';
import { ShippingFactory } from '../shipping/shipping.factory';
import { CreateCheckoutDto, VerifyPaymentDto } from './dto/checkout.dto';
import { RedisService } from '../redis/redis.service';
import { OrderStatus, PaymentStatus, DiscountType } from '../common/constants';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly paymentFactory: PaymentFactory,
    private readonly shippingFactory: ShippingFactory,
    private readonly redisService: RedisService,
    @InjectQueue('order-jobs') private readonly orderQueue: Queue,
  ) {}

  async createCheckout(dto: CreateCheckoutDto, userId?: string) {
    // 1. Fetch Cart Items
    const cart: any = await this.cartService.getCart(userId, dto.guestCartId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 2. Validate Stock and Reserve Inventory in Database
    return this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalWeight = 0;
      const orderItemsToCreate: any[] = [];

      for (const item of cart.items) {
        // Look up variant from database to get fresh price and prevent tampering
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant || !variant.isActive) {
          throw new BadRequestException(`Product variant ${item.variantId} is no longer active`);
        }

        // Validate stock levels across warehouses
        const inventories = await tx.inventory.findMany({
          where: { variantId: variant.id },
        });
        const totalStock = inventories.reduce((sum, i) => sum + i.quantity, 0);
        const totalReserved = inventories.reduce((sum, i) => sum + i.reservedQuantity, 0);
        const available = totalStock - totalReserved;

        if (available < item.quantity) {
          throw new BadRequestException(`Product ${variant.product.name} is out of stock or reserved by other customers.`);
        }

        // Reserve stock in first warehouse containing stock
        let qtyToReserve = item.quantity;
        for (const inv of inventories) {
          const invAvail = inv.quantity - inv.reservedQuantity;
          if (invAvail > 0) {
            const blockAmt = Math.min(qtyToReserve, invAvail);
            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                reservedQuantity: {
                  increment: blockAmt,
                },
              },
            });
            qtyToReserve -= blockAmt;
            if (qtyToReserve === 0) break;
          }
        }

        const itemPrice = variant.price ? Number(variant.price) : Number(variant.product.basePrice);
        const lineTotal = itemPrice * item.quantity;

        subtotal += lineTotal;
        totalWeight += (variant.weight ? Number(variant.weight) : 0.5) * item.quantity;

        orderItemsToCreate.push({
          variantId: variant.id,
          quantity: item.quantity,
          price: itemPrice,
          discount: 0.00,
          total: lineTotal,
        });
      }

      // 3. Apply Coupon Code if valid
      let discount = 0;
      if (dto.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: dto.couponCode },
        });

        if (!coupon || !coupon.isActive || coupon.startDate > new Date() || coupon.endDate < new Date()) {
          throw new BadRequestException('Invalid or expired coupon code');
        }

        if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
          throw new BadRequestException('Coupon usage limit reached');
        }

        if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
          throw new BadRequestException(`Minimum order value for coupon is $${coupon.minOrderValue}`);
        }

        if (coupon.discountType === DiscountType.PERCENTAGE) {
          discount = (subtotal * Number(coupon.discountValue)) / 100;
          if (coupon.maxDiscountAmount) {
            discount = Math.min(discount, Number(coupon.maxDiscountAmount));
          }
        } else {
          discount = Number(coupon.discountValue);
        }

        // Increment coupon usage
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      // 4. Calculate Shipping Fees
      const postalCode = dto.shippingAddress.postalCode || '10001';
      const carrier = this.shippingFactory.getCarrier('SHIPROCKET'); // default
      const shipEstimate = await carrier.calculateRates(postalCode, totalWeight);
      
      // Free shipping rule: free if subtotal > $100
      let shippingFee = subtotal > 100 ? 0.00 : shipEstimate.rate;

      // 5. Calculate flat 10% Tax
      const taxableAmount = Math.max(0, subtotal - discount);
      const tax = taxableAmount * 0.10;

      // Final Total
      const total = taxableAmount + shippingFee + tax;

      // 6. Generate order header
      const orderNumber = `ORD_${Date.now()}`;
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: dto.paymentMethod === 'COD' ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
          subtotal,
          discount,
          shippingFee,
          tax,
          total,
          couponCode: dto.couponCode || null,
          paymentMethod: dto.paymentMethod,
          paymentStatus: dto.paymentMethod === 'COD' ? PaymentStatus.PENDING : PaymentStatus.PENDING,
          shippingAddressJson: dto.shippingAddress,
          billingAddressJson: dto.billingAddress,
          notes: dto.deliveryInstructions || null,
          items: {
            create: orderItemsToCreate,
          },
        },
      });

      // 7. Invoke Payment Gateway Intent
      const gateway = this.paymentFactory.getProvider(dto.paymentMethod);
      const paymentIntent = await gateway.createPaymentIntent(total, 'USD', order.id);

      // Create Payment log in database
      const paymentRecord = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          paymentMethod: dto.paymentMethod,
          paymentStatus: dto.paymentMethod === 'COD' ? PaymentStatus.PENDING : PaymentStatus.PENDING,
          transactionId: paymentIntent.paymentId,
          rawResponse: paymentIntent.rawResponse,
        },
      });

      // 8. If COD or instant success, immediately commit inventory deduction
      if (dto.paymentMethod === 'COD') {
        for (const item of orderItemsToCreate) {
          const inventory = await tx.inventory.findFirst({
            where: { variantId: item.variantId },
          });
          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: { decrement: item.quantity },
                reservedQuantity: { decrement: item.quantity },
              },
            });
          }
        }

        // Queue order email
        await this.orderQueue.add('order-confirmed', { orderId: order.id });
      }

      // 9. Clear Cart
      if (userId) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      } else if (dto.guestCartId) {
        await this.redisService.del(`cart:guest:${dto.guestCartId}`);
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total,
        paymentId: paymentRecord.id,
        gatewayPaymentId: paymentIntent.paymentId,
        clientSecret: paymentIntent.clientSecret || null,
      };
    });
  }

  // Verify payment after payment widget returns success
  async verifyPayment(dto: VerifyPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: true,
        payments: {
          where: { id: dto.paymentId },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const payment = order.payments[0];
    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    const gateway = this.paymentFactory.getProvider(order.paymentMethod as any);
    const verification = await gateway.verifyPayment(dto);

    return this.prisma.$transaction(async (tx) => {
      if (verification.success) {
        // 1. Update Payment status to COMPLETED
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: PaymentStatus.COMPLETED,
            transactionId: verification.transactionId,
            rawResponse: verification.rawResponse,
          },
        });

        // 2. Update Order status to CONFIRMED
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.COMPLETED,
          },
        });

        // 3. Deduct stock from physical inventory and release reservation
        for (const item of order.items) {
          const inventory = await tx.inventory.findFirst({
            where: { variantId: item.variantId },
          });
          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
                reservedQuantity: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }

        // 4. Create Transaction
        await tx.transaction.create({
          data: {
            paymentId: payment.id,
            action: 'CHARGE',
            amount: order.total,
            status: 'SUCCESS',
            externalRefId: verification.transactionId,
          },
        });

        // 5. Trigger Async Job for Confirmation Emails/Admin notifications
        await this.orderQueue.add('order-confirmed', { orderId: order.id });

        return { success: true, message: 'Payment verified and order confirmed.' };
      } else {
        // Payment failed - update logs and release stock reservation
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: PaymentStatus.FAILED,
            rawResponse: verification.rawResponse,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PENDING, // keep order in pending so customer can retry
            paymentStatus: PaymentStatus.FAILED,
          },
        });

        // Release stock reservation
        for (const item of order.items) {
          const inventory = await tx.inventory.findFirst({
            where: { variantId: item.variantId },
          });
          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                reservedQuantity: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }

        throw new BadRequestException('Payment verification failed');
      }
    });
  }
}

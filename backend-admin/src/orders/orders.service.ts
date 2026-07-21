import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '@catalog/shared/constants';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrders(page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        payments: {
          include: {
            transactions: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // If updating to CANCELLED or REFUNDED, release reserved stock if it hasn't been decremented yet,
      // or restock if it was already decremented.
      if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
        for (const item of order.items) {
          // Check if variant has inventory record
          const inventory = await tx.inventory.findFirst({
            where: { variantId: item.variantId },
          });
          if (inventory) {
            // Release reservation or restore stock
            if (order.status === OrderStatus.PENDING) {
              await tx.inventory.update({
                where: { id: inventory.id },
                data: {
                  reservedQuantity: {
                    decrement: item.quantity,
                  },
                },
              });
            } else {
              // Restock items
              await tx.inventory.update({
                where: { id: inventory.id },
                data: {
                  quantity: {
                    increment: item.quantity,
                  },
                },
              });
            }
          }
        }
      }

      return tx.order.update({
        where: { id },
        data: { status },
      });
    });
  }

  async assignShipment(id: string, provider: string, trackingId: string, estimatedDelivery: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        shippingProvider: provider,
        shippingTrackingId: trackingId,
        estimatedDelivery: new Date(estimatedDelivery),
        status: OrderStatus.SHIPPED,
      },
    });
  }

  async processRefund(id: string, amount?: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        payments: {
          where: { paymentStatus: PaymentStatus.COMPLETED },
        },
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const completedPayment = order.payments[0];
    if (!completedPayment) {
      throw new BadRequestException('No completed payment found for this order to refund');
    }

    const refundAmount = amount ? amount : Number(order.total);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create a transaction log
      const transaction = await tx.transaction.create({
        data: {
          paymentId: completedPayment.id,
          action: 'REFUND',
          amount: refundAmount,
          status: 'SUCCESS',
          externalRefId: `REF_${Date.now()}`,
        },
      });

      // 2. Update payment status
      await tx.payment.update({
        where: { id: completedPayment.id },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
        },
      });

      // 3. Update order status and restock inventory
      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.REFUNDED,
        },
      });

      for (const item of order.items) {
        const inventory = await tx.inventory.findFirst({
          where: { variantId: item.variantId },
        });
        if (inventory) {
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return transaction;
    });
  }
}

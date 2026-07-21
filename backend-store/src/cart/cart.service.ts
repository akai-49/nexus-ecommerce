import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AddToCartDto } from './dto/cart.dto';

interface RedisCartItem {
  variantId: string;
  quantity: number;
}

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  // Helper to check real-time stock
  private async validateStock(variantId: string, requestedQty: number) {
    const inventories = await this.prisma.inventory.findMany({
      where: { variantId },
    });

    const totalStock = inventories.reduce((sum, inv) => sum + inv.quantity, 0);
    const totalReserved = inventories.reduce((sum, inv) => sum + inv.reservedQuantity, 0);
    const available = totalStock - totalReserved;

    if (available < requestedQty) {
      throw new BadRequestException(`Insufficient stock. Only ${Math.max(0, available)} units available.`);
    }
  }

  // Get active cart
  async getCart(userId?: string, guestId?: string) {
    if (userId) {
      // Fetch DB cart
      let cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                  images: true,
                },
              },
            },
          },
        },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId },
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true,
                    images: true,
                  },
                },
              },
            },
          },
        });
      }

      return cart;
    } else if (guestId) {
      // Fetch Redis cart
      const redisKey = `cart:guest:${guestId}`;
      const cached = await this.redisService.get(redisKey);
      const items: RedisCartItem[] = cached ? JSON.parse(cached) : [];

      // Resolve variant data
      const resolvedItems: any[] = [];
      for (const item of items) {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            product: true,
            images: true,
          },
        });
        if (variant) {
          resolvedItems.push({
            id: `guest-item-${variant.id}`,
            cartId: guestId,
            variantId: variant.id,
            quantity: item.quantity,
            variant,
          });
        }
      }

      return {
        id: guestId,
        userId: null,
        items: resolvedItems,
      };
    } else {
      throw new BadRequestException('Either userId or guestId must be provided');
    }
  }

  // Add item
  async addItem(dto: AddToCartDto, userId?: string, guestId?: string) {
    await this.validateStock(dto.variantId, dto.quantity);

    if (userId) {
      const cart: any = await this.getCart(userId);
      const existing = cart.items.find((item: any) => item.variantId === dto.variantId);

      if (existing) {
        await this.validateStock(dto.variantId, existing.quantity + dto.quantity);
        return this.prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + dto.quantity },
        });
      } else {
        return this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            variantId: dto.variantId,
            quantity: dto.quantity,
          },
        });
      }
    } else if (guestId) {
      const redisKey = `cart:guest:${guestId}`;
      const cached = await this.redisService.get(redisKey);
      const items: RedisCartItem[] = cached ? JSON.parse(cached) : [];

      const existingIndex = items.findIndex((item) => item.variantId === dto.variantId);
      if (existingIndex > -1) {
        await this.validateStock(dto.variantId, items[existingIndex].quantity + dto.quantity);
        items[existingIndex].quantity += dto.quantity;
      } else {
        items.push({ variantId: dto.variantId, quantity: dto.quantity });
      }

      await this.redisService.set(redisKey, JSON.stringify(items), 2592000); // 30 days guest cart TTL
      return { variantId: dto.variantId, quantity: dto.quantity };
    }
  }

  // Update item quantity
  async updateQuantity(variantId: string, quantity: number, userId?: string, guestId?: string) {
    await this.validateStock(variantId, quantity);

    if (userId) {
      const cart: any = await this.getCart(userId);
      const existing = cart.items.find((item: any) => item.variantId === variantId);

      if (!existing) {
        throw new NotFoundException('Item not found in cart');
      }

      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity },
      });
    } else if (guestId) {
      const redisKey = `cart:guest:${guestId}`;
      const cached = await this.redisService.get(redisKey);
      const items: RedisCartItem[] = cached ? JSON.parse(cached) : [];

      const index = items.findIndex((item) => item.variantId === variantId);
      if (index === -1) {
        throw new NotFoundException('Item not found in cart');
      }

      items[index].quantity = quantity;
      await this.redisService.set(redisKey, JSON.stringify(items), 2592000);
      return { variantId, quantity };
    }
  }

  // Remove item
  async removeItem(variantId: string, userId?: string, guestId?: string) {
    if (userId) {
      const cart: any = await this.getCart(userId);
      const existing = cart.items.find((item: any) => item.variantId === variantId);

      if (existing) {
        await this.prisma.cartItem.delete({
          where: { id: existing.id },
        });
      }
      return { deleted: true };
    } else if (guestId) {
      const redisKey = `cart:guest:${guestId}`;
      const cached = await this.redisService.get(redisKey);
      let items: RedisCartItem[] = cached ? JSON.parse(cached) : [];

      items = items.filter((item) => item.variantId !== variantId);
      await this.redisService.set(redisKey, JSON.stringify(items), 2592000);
      return { deleted: true };
    }
  }

  // Merge guest cart items into DB cart after login
  async mergeCart(guestId: string, userId: string) {
    const redisKey = `cart:guest:${guestId}`;
    const cached = await this.redisService.get(redisKey);
    const guestItems: RedisCartItem[] = cached ? JSON.parse(cached) : [];

    if (guestItems.length === 0) {
      return this.getCart(userId);
    }

    const dbCart: any = await this.getCart(userId);

    await this.prisma.$transaction(async (tx) => {
      for (const guestItem of guestItems) {
        const existing = dbCart.items.find((item: any) => item.variantId === guestItem.variantId);
        if (existing) {
          // Take the combined quantity
          const newQty = existing.quantity + guestItem.quantity;
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: newQty },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: dbCart.id,
              variantId: guestItem.variantId,
              quantity: guestItem.quantity,
            },
          });
        }
      }
    });

    // Delete guest cart from Redis
    await this.redisService.del(redisKey);

    return this.getCart(userId);
  }
}

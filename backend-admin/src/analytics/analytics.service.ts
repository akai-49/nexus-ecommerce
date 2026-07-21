import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '../common/constants';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary() {
    // 1. Get total revenue (excluding Cancelled/Refunded orders)
    const ordersResult = await this.prisma.order.aggregate({
      where: {
        status: {
          notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    const totalRevenue = ordersResult._sum.total ? Number(ordersResult._sum.total) : 0;
    const totalOrders = ordersResult._count.id;

    // 2. Count low stock variants
    const lowStockCount = await this.prisma.inventory.count({
      where: {
        quantity: {
          lte: this.prisma.inventory.fields.lowStockThreshold,
        },
      },
    });

    // 3. Count abandoned carts (modified > 6 hours ago and has items)
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

    const abandonedCartsCount = await this.prisma.cart.count({
      where: {
        updatedAt: {
          lte: sixHoursAgo,
        },
        items: {
          some: {}, // Has at least one item
        },
      },
    });

    // 4. Get active customers count
    const customerCount = await this.prisma.user.count({
      where: {
        roles: {
          some: {
            role: {
              name: 'CUSTOMER',
            },
          },
        },
      },
    });

    return {
      totalRevenue,
      totalOrders,
      lowStockCount,
      abandonedCartsCount,
      customerCount,
    };
  }

  async getTopSellingProducts(limit = 5) {
    const orderItems = await this.prisma.orderItem.groupBy({
      by: ['variantId'],
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    const result: any[] = [];
    for (const item of orderItems) {
      if (!item.variantId) continue;
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: {
          product: true,
        },
      });

      if (variant) {
        result.push({
          productId: variant.productId,
          productName: variant.product.name,
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
          quantitySold: item._sum.quantity,
          revenueGenerated: item._sum.total ? Number(item._sum.total) : 0,
        });
      }
    }

    return result;
  }

  async getDailySalesReport(days = 7) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: dateLimit,
        },
        status: {
          notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
    });

    // Group by day key (YYYY-MM-DD)
    const dailyData: Record<string, { date: string; sales: number; revenue: number }> = {};

    // Initialize map with all dates in range
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyData[key] = { date: key, sales: 0, revenue: 0 };
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().split('T')[0];
      if (dailyData[key]) {
        dailyData[key].sales += 1;
        dailyData[key].revenue += Number(order.total);
      }
    }

    // Sort chronologically
    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  }
}

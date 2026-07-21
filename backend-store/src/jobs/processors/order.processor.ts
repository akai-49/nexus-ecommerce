import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('order-jobs')
@Injectable()
export class OrderProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`[BullMQ Worker] Processing Job "${job.name}" (ID: ${job.id})`);

    switch (job.name) {
      case 'order-confirmed': {
        const { orderId } = job.data;
        await this.handleOrderConfirmation(orderId);
        break;
      }
      case 'abandoned-cart-check': {
        await this.handleAbandonedCarts();
        break;
      }
      default:
        console.warn(`[BullMQ Worker] Unknown job: ${job.name}`);
    }
  }

  private async handleOrderConfirmation(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: true },
    });

    if (!order) {
      console.error(`[BullMQ Worker] Order ${orderId} not found`);
      return;
    }

    const email = order.user?.email || (order.shippingAddressJson as any).email || 'customer@example.com';

    console.log(`[BullMQ Worker] 1. Generating PDF Invoice for Order ${order.orderNumber}...`);
    // Simulate PDF invoice write
    const invoiceUrl = `http://localhost:5000/invoices/INV_${order.orderNumber}.pdf`;
    
    console.log(`[BullMQ Worker] 2. Dispatching Confirmation Email to ${email}...`);
    console.log(`[BullMQ Worker] 3. Notifying Admin CMS about Order ${order.orderNumber} ($${order.total})...`);

    // In-app Notification log
    if (order.userId) {
      await this.prisma.notification.create({
        data: {
          userId: order.userId,
          title: 'Order Confirmed!',
          message: `Your order #${order.orderNumber} of $${order.total} has been confirmed.`,
          type: 'EMAIL',
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    }
  }

  private async handleAbandonedCarts() {
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

    const carts = await this.prisma.cart.findMany({
      where: {
        updatedAt: { lte: sixHoursAgo },
        items: { some: {} },
      },
      include: { user: true },
    });

    console.log(`[BullMQ Worker] Found ${carts.length} abandoned carts to recovery email.`);
    for (const cart of carts) {
      if (cart.user) {
        console.log(`[BullMQ Worker] Sending recovery email to ${cart.user.email}...`);
      }
    }
  }
}

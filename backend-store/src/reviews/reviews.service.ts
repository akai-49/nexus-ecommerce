import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(
    userId: string,
    productId: string,
    rating: number,
    comment?: string,
  ) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // 1. Verify user purchased a variant of this product
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        status: 'DELIVERED',
        items: {
          some: {
            variant: {
              productId,
            },
          },
        },
      },
    });

    if (orders.length === 0) {
      throw new BadRequestException('You can only review products that have been delivered to you.');
    }

    // 2. Create the review (requires admin moderation/approval by default)
    const review = await this.prisma.review.create({
      data: {
        productId,
        userId,
        rating,
        comment,
        isApproved: false, // Moderated by default
      },
    });

    return review;
  }

  async getProductReviews(productId: string) {
    return this.prisma.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

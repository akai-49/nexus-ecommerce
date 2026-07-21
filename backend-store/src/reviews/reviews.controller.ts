import { Controller, Post, Get, Body, Param, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reviews & Ratings')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a product review (Delivered purchase required)' })
  createReview(
    @Req() req: any,
    @Body('productId') productId: string,
    @Body('rating') rating: number,
    @Body('comment') comment?: string,
  ) {
    const userId = req.user.id;
    return this.reviewsService.createReview(userId, productId, rating, comment);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get approved reviews for a product' })
  getReviews(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }
}

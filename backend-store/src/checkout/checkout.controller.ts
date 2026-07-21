import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto, VerifyPaymentDto } from './dto/checkout.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Checkout Pipeline')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit checkout details and initiate payment' })
  checkout(@Req() req: any, @Body() dto: CreateCheckoutDto) {
    const userId = req.user?.id;
    return this.checkoutService.createCheckout(dto, userId);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify payment gateway token and confirm order' })
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.checkoutService.verifyPayment(dto);
  }
}

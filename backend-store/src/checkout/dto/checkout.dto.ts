import { IsString, IsNotEmpty, IsOptional, IsEnum, IsJSON, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../common/constants';

export class CreateCheckoutDto {
  @ApiProperty({ example: 'STRIPE' })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiProperty({ example: 'SAVE10', required: false })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiProperty({ example: '{"fullName": "Alice", "line1": "123 Main St", "city": "NYC", "postalCode": "10001", "phone": "+123"}', description: 'JSON structure of shipping address' })
  @IsNotEmpty()
  shippingAddress!: any;

  @ApiProperty({ example: '{"fullName": "Alice", "line1": "123 Main St", "city": "NYC", "postalCode": "10001", "phone": "+123"}', description: 'JSON structure of billing address' })
  @IsNotEmpty()
  billingAddress!: any;

  @ApiProperty({ example: 'guest@example.com', required: false, description: 'Required only for Guest Checkout' })
  @IsEmail()
  @IsOptional()
  guestEmail?: string;

  @ApiProperty({ example: 'guest-cart-uuid', required: false, description: 'Required only for Guest Checkout' })
  @IsString()
  @IsOptional()
  guestCartId?: string;

  @ApiProperty({ example: 'Leave at front door', required: false })
  @IsString()
  @IsOptional()
  deliveryInstructions?: string;
}

export class VerifyPaymentDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({ example: 'txn_1234567890' })
  @IsString()
  @IsNotEmpty()
  paymentId!: string;

  @ApiProperty({ example: 'success' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

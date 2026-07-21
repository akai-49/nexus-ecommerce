import { Injectable, BadRequestException } from '@nestjs/common';
import { StripeProvider } from './providers/stripe.provider';
import { RazorpayProvider } from './providers/razorpay.provider';
import { PayPalProvider } from './providers/paypal.provider';
import { CodProvider } from './providers/cod.provider';
import { IPaymentGateway } from './payment-gateway.interface';
import { PaymentMethod } from '../common/constants';

@Injectable()
export class PaymentFactory {
  constructor(
    private readonly stripeProvider: StripeProvider,
    private readonly razorpayProvider: RazorpayProvider,
    private readonly paypalProvider: PayPalProvider,
    private readonly codProvider: CodProvider,
  ) {}

  getProvider(method: PaymentMethod): IPaymentGateway {
    switch (method) {
      case PaymentMethod.STRIPE:
        return this.stripeProvider;
      case PaymentMethod.RAZORPAY:
        return this.razorpayProvider;
      case PaymentMethod.PAYPAL:
        return this.paypalProvider;
      case PaymentMethod.COD:
        return this.codProvider;
      default:
        throw new BadRequestException(`Unsupported payment method: ${method}`);
    }
  }
}

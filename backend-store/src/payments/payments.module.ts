import { Module } from '@nestjs/common';
import { StripeProvider } from './providers/stripe.provider';
import { RazorpayProvider } from './providers/razorpay.provider';
import { PayPalProvider } from './providers/paypal.provider';
import { CodProvider } from './providers/cod.provider';
import { PaymentFactory } from './payment.factory';

@Module({
  providers: [
    StripeProvider,
    RazorpayProvider,
    PayPalProvider,
    CodProvider,
    PaymentFactory,
  ],
  exports: [PaymentFactory],
})
export class PaymentsModule {}

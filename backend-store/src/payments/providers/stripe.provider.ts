import { Injectable } from '@nestjs/common';
import { IPaymentGateway, PaymentIntentResult, PaymentVerificationResult, RefundResult } from '../payment-gateway.interface';

@Injectable()
export class StripeProvider implements IPaymentGateway {
  async createPaymentIntent(amount: number, currency: string, orderId: string): Promise<PaymentIntentResult> {
    console.log(`[Stripe] Creating payment intent for Order ${orderId} of amount ${amount} ${currency}`);
    // Simulate API call to Stripe
    const stripePaymentId = `ch_stripe_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `pi_secret_${Math.random().toString(36).substr(2, 15)}`;

    return {
      paymentId: stripePaymentId,
      clientSecret,
      rawResponse: { gateway: 'stripe', status: 'requires_payment_method', amount, currency },
    };
  }

  async verifyPayment(payload: any): Promise<PaymentVerificationResult> {
    console.log('[Stripe] Verifying payment token/payload:', payload);
    // Simulate webhook or token verify
    const success = payload.token !== 'fail';
    return {
      success,
      transactionId: payload.paymentId || `txn_stripe_${Date.now()}`,
      rawResponse: { status: success ? 'succeeded' : 'failed', verifyPayload: payload },
    };
  }

  async refundPayment(transactionId: string, amount: number): Promise<RefundResult> {
    console.log(`[Stripe] Refunding transaction ${transactionId} with amount ${amount}`);
    return {
      success: true,
      rawResponse: { status: 'refunded', amount, transactionId },
    };
  }
}

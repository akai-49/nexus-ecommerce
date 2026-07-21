import { Injectable } from '@nestjs/common';
import { IPaymentGateway, PaymentIntentResult, PaymentVerificationResult, RefundResult } from '../payment-gateway.interface';

@Injectable()
export class PayPalProvider implements IPaymentGateway {
  async createPaymentIntent(amount: number, currency: string, orderId: string): Promise<PaymentIntentResult> {
    console.log(`[PayPal] Creating checkout token for Order ${orderId}`);
    const paypalOrderId = `EC-${Math.random().toString(36).substr(2, 10).toUpperCase()}`;

    return {
      paymentId: paypalOrderId,
      clientSecret: `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrderId}`, // URL redirect
      rawResponse: { gateway: 'paypal', status: 'created', token: paypalOrderId },
    };
  }

  async verifyPayment(payload: any): Promise<PaymentVerificationResult> {
    console.log('[PayPal] Capturing order tokens:', payload);
    const success = payload.token !== 'cancelled';
    return {
      success,
      transactionId: payload.payerId || `txn_paypal_${Date.now()}`,
      rawResponse: { status: success ? 'COMPLETED' : 'CANCELLED' },
    };
  }

  async refundPayment(transactionId: string, amount: number): Promise<RefundResult> {
    console.log(`[PayPal] Creating capture refund for ${transactionId}`);
    return {
      success: true,
      rawResponse: { status: 'refunded', amount },
    };
  }
}

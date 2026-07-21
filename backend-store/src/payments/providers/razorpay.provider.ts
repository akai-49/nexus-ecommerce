import { Injectable } from '@nestjs/common';
import { IPaymentGateway, PaymentIntentResult, PaymentVerificationResult, RefundResult } from '../payment-gateway.interface';

@Injectable()
export class RazorpayProvider implements IPaymentGateway {
  async createPaymentIntent(amount: number, currency: string, orderId: string): Promise<PaymentIntentResult> {
    console.log(`[Razorpay] Creating order for Order ${orderId} of amount ${amount}`);
    const razorpayOrderId = `order_rzp_${Math.random().toString(36).substr(2, 9)}`;

    return {
      paymentId: razorpayOrderId,
      clientSecret: razorpayOrderId, // Razorpay uses Order ID directly for checkout widget
      rawResponse: { gateway: 'razorpay', status: 'created', amount },
    };
  }

  async verifyPayment(payload: any): Promise<PaymentVerificationResult> {
    console.log('[Razorpay] Verifying signature details:', payload);
    // In production we verify signature using HMAC SHA256
    const success = payload.signature !== 'invalid';
    return {
      success,
      transactionId: payload.paymentId || `pay_rzp_${Date.now()}`,
      rawResponse: { signature_verified: success },
    };
  }

  async refundPayment(transactionId: string, amount: number): Promise<RefundResult> {
    console.log(`[Razorpay] Processing refund for payment ${transactionId}`);
    return {
      success: true,
      rawResponse: { status: 'refunded', amount, payment_id: transactionId },
    };
  }
}

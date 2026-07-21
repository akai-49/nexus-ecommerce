import { Injectable } from '@nestjs/common';
import { IPaymentGateway, PaymentIntentResult, PaymentVerificationResult, RefundResult } from '../payment-gateway.interface';

@Injectable()
export class CodProvider implements IPaymentGateway {
  async createPaymentIntent(amount: number, currency: string, orderId: string): Promise<PaymentIntentResult> {
    console.log(`[COD] Initializing COD for Order ${orderId}`);
    return {
      paymentId: `cod_${Date.now()}`,
      rawResponse: { status: 'pending_delivery', amount },
    };
  }

  async verifyPayment(payload: any): Promise<PaymentVerificationResult> {
    console.log('[COD] COD verified on order submission');
    return {
      success: true,
      transactionId: `cod_txn_${Date.now()}`,
      rawResponse: { status: 'cash_on_delivery' },
    };
  }

  async refundPayment(transactionId: string, amount: number): Promise<RefundResult> {
    console.log(`[COD] Refunding COD transaction ${transactionId}`);
    return {
      success: true,
      rawResponse: { status: 'refunded_cash', amount },
    };
  }
}

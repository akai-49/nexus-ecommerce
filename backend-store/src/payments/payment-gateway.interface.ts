export interface PaymentIntentResult {
  paymentId: string;
  clientSecret?: string;
  rawResponse: any;
}

export interface PaymentVerificationResult {
  success: boolean;
  transactionId: string;
  rawResponse: any;
}

export interface RefundResult {
  success: boolean;
  rawResponse: any;
}

export interface IPaymentGateway {
  createPaymentIntent(amount: number, currency: string, orderId: string): Promise<PaymentIntentResult>;
  verifyPayment(payload: any): Promise<PaymentVerificationResult>;
  refundPayment(transactionId: string, amount: number): Promise<RefundResult>;
}

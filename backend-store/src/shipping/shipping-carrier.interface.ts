export interface ShippingRateResult {
  rate: number;
  carrier: string;
  estimatedDays: number;
}

export interface ShipmentResult {
  trackingId: string;
  status: string;
}

export interface IShippingCarrier {
  calculateRates(destPostalCode: string, weightKg: number): Promise<ShippingRateResult>;
  createShipment(orderId: string, address: any, weightKg: number): Promise<ShipmentResult>;
}

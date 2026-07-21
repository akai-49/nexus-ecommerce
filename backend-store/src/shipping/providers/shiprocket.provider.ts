import { Injectable } from '@nestjs/common';
import { IShippingCarrier, ShippingRateResult, ShipmentResult } from '../shipping-carrier.interface';

@Injectable()
export class ShiprocketProvider implements IShippingCarrier {
  async calculateRates(destPostalCode: string, weightKg: number): Promise<ShippingRateResult> {
    console.log(`[Shiprocket] Estimating rate for postal code ${destPostalCode}, weight ${weightKg}kg`);
    // Simulate rate lookup. Base rate is $5 + $1.5 per kg
    const rate = 5.0 + weightKg * 1.5;
    return {
      rate,
      carrier: 'SHIPROCKET',
      estimatedDays: 3,
    };
  }

  async createShipment(orderId: string, address: any, weightKg: number): Promise<ShipmentResult> {
    console.log(`[Shiprocket] Generating shipment for order ${orderId}`);
    return {
      trackingId: `SR_${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: 'AWAITING_PICKUP',
    };
  }
}

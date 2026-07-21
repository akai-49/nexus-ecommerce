import { Injectable } from '@nestjs/common';
import { IShippingCarrier, ShippingRateResult, ShipmentResult } from '../shipping-carrier.interface';

@Injectable()
export class BlueDartProvider implements IShippingCarrier {
  async calculateRates(destPostalCode: string, weightKg: number): Promise<ShippingRateResult> {
    console.log(`[BlueDart] Estimating rate for postal code ${destPostalCode}, weight ${weightKg}kg`);
    const rate = 8.0 + weightKg * 1.2;
    return {
      rate,
      carrier: 'BLUEDART',
      estimatedDays: 2, // express shipping!
    };
  }

  async createShipment(orderId: string, address: any, weightKg: number): Promise<ShipmentResult> {
    console.log(`[BlueDart] Generating shipment for order ${orderId}`);
    return {
      trackingId: `BD_${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: 'PICKED_UP',
    };
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { ShiprocketProvider } from './providers/shiprocket.provider';
import { DelhiveryProvider } from './providers/delhivery.provider';
import { BlueDartProvider } from './providers/bluedart.provider';
import { IShippingCarrier } from './shipping-carrier.interface';

@Injectable()
export class ShippingFactory {
  constructor(
    private readonly shiprocketProvider: ShiprocketProvider,
    private readonly delhiveryProvider: DelhiveryProvider,
    private readonly bluedartProvider: BlueDartProvider,
  ) {}

  getCarrier(name: string): IShippingCarrier {
    const key = name.toUpperCase();
    if (key === 'SHIPROCKET') {
      return this.shiprocketProvider;
    } else if (key === 'DELHIVERY') {
      return this.delhiveryProvider;
    } else if (key === 'BLUEDART') {
      return this.bluedartProvider;
    } else {
      // Default fallback
      return this.shiprocketProvider;
    }
  }
}

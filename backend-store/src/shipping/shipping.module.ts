import { Module } from '@nestjs/common';
import { ShiprocketProvider } from './providers/shiprocket.provider';
import { DelhiveryProvider } from './providers/delhivery.provider';
import { BlueDartProvider } from './providers/bluedart.provider';
import { ShippingFactory } from './shipping.factory';

@Module({
  providers: [
    ShiprocketProvider,
    DelhiveryProvider,
    BlueDartProvider,
    ShippingFactory,
  ],
  exports: [ShippingFactory],
})
export class ShippingModule {}

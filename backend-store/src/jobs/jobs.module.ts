import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderProcessor } from './processors/order.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: Number(configService.get<number>('REDIS_PORT') || 6379),
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'order-jobs',
    }),
  ],
  providers: [OrderProcessor],
  exports: [BullModule],
})
export class JobsModule {}

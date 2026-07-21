import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderProcessor } from './processors/order.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrlStr = configService.get<string>('REDIS_URL');
        if (redisUrlStr) {
          try {
            const parsed = new URL(redisUrlStr);
            const isTls = parsed.protocol === 'rediss:';
            return {
              connection: {
                host: parsed.hostname,
                port: Number(parsed.port),
                password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
                username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
                tls: isTls ? {} : undefined,
              },
            };
          } catch (e) {
            console.error('Failed to parse REDIS_URL, falling back to REDIS_HOST', e);
          }
        }
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST') || 'localhost',
            port: Number(configService.get<number>('REDIS_PORT') || 6379),
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: 'order-jobs',
    }),
  ],
  providers: [OrderProcessor],
  exports: [BullModule],
})
export class JobsModule {}

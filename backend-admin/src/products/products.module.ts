import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { BulkService } from './bulk.service';
import { BulkController } from './bulk.controller';

@Module({
  providers: [ProductsService, BulkService],
  controllers: [ProductsController, BulkController],
  exports: [ProductsService, BulkService],
})
export class ProductsModule {}

import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Roles as RoleEnum, OrderStatus } from '@catalog/shared/constants';

@ApiTags('Order Management CMS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.ORDER_MANAGER)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List all customer orders' })
  getOrders(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getOrders(page, limit, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of an order by ID' })
  getOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update an order status' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.updateOrderStatus(id, status);
  }

  @Post(':id/shipment')
  @ApiOperation({ summary: 'Assign tracking details and ship order' })
  assignShipment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('provider') provider: string,
    @Body('trackingId') trackingId: string,
    @Body('estimatedDelivery') estimatedDelivery: string,
  ) {
    return this.ordersService.assignShipment(id, provider, trackingId, estimatedDelivery);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Process return/refund for paid order' })
  processRefund(@Param('id', ParseUUIDPipe) id: string, @Body('amount') amount?: number) {
    return this.ordersService.processRefund(id, amount);
  }
}

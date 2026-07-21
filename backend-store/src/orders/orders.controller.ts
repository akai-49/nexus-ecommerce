import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Customer Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List all user orders' })
  getUserOrders(@Req() req: any) {
    return this.ordersService.getUserOrders(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID' })
  getOrderDetails(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getOrderDetails(req.user.id, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  cancelOrder(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.cancelOrder(req.user.id, id);
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Request return for delivered order' })
  requestReturn(
    @Req() req: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.requestReturn(req.user.id, id, reason || 'No reason provided');
  }
}

import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Roles as RoleEnum } from '@catalog/shared/constants';

@ApiTags('CMS Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.PRODUCT_MANAGER, RoleEnum.ORDER_MANAGER)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get total revenue, orders, low stock, and active customers counts' })
  getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling product variants' })
  getTopSellingProducts(@Query('limit', ParseIntPipe) limit = 5) {
    return this.analyticsService.getTopSellingProducts(limit);
  }

  @Get('daily-sales')
  @ApiOperation({ summary: 'Get sales and revenue counts grouped by date' })
  getDailySales(@Query('days', ParseIntPipe) days = 7) {
    return this.analyticsService.getDailySalesReport(days);
  }
}

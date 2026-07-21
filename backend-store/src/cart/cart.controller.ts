import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateQuantityDto } from './dto/cart.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Cart Operations')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current cart (Guest or Logged in)' })
  @ApiQuery({ name: 'guestId', required: false })
  getCart(@Req() req: any, @Query('guestId') guestId?: string) {
    const userId = req.user?.id;
    return this.cartService.getCart(userId, guestId);
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiQuery({ name: 'guestId', required: false })
  addItem(@Req() req: any, @Body() dto: AddToCartDto, @Query('guestId') guestId?: string) {
    const userId = req.user?.id;
    return this.cartService.addItem(dto, userId, guestId);
  }

  @Patch(':variantId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update item quantity in cart' })
  @ApiQuery({ name: 'guestId', required: false })
  updateQuantity(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateQuantityDto,
    @Req() req: any,
    @Query('guestId') guestId?: string,
  ) {
    const userId = req.user?.id;
    return this.cartService.updateQuantity(variantId, dto.quantity, userId, guestId);
  }

  @Delete(':variantId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiQuery({ name: 'guestId', required: false })
  removeItem(@Param('variantId') variantId: string, @Req() req: any, @Query('guestId') guestId?: string) {
    const userId = req.user?.id;
    return this.cartService.removeItem(variantId, userId, guestId);
  }

  @Post('merge')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge guest cart into logged in database cart' })
  mergeCart(@Req() req: any, @Body('guestId') guestId: string) {
    const userId = req.user?.id;
    if (!userId) {
      return { message: 'No logged in user to merge cart to' };
    }
    return this.cartService.mergeCart(guestId, userId);
  }
}

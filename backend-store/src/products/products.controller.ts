import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Product Catalog Gateway')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get hierarchical category tree' })
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get('brands')
  @ApiOperation({ summary: 'Get all active brands' })
  getBrands() {
    return this.productsService.getBrands();
  }

  @Get('search/suggestions')
  @ApiOperation({ summary: 'Get search autocomplete suggestions' })
  getSuggestions(@Query('q') query: string) {
    return this.productsService.getSearchSuggestions(query);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated catalog list with search, filter and sort' })
  getProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('color') color?: string,
    @Query('size') size?: string,
    @Query('sortBy') sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest',
  ) {
    return this.productsService.getProducts({
      page,
      limit,
      search,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      color,
      size,
      sortBy,
    });
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a product by URL slug' })
  getProductBySlug(@Param('slug') slug: string) {
    return this.productsService.getProductBySlug(slug);
  }
}

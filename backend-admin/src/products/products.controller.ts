import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateVariantDto, UpdateVariantDto } from './dto/variant.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Roles as RoleEnum } from '../common/constants';

@ApiTags('Product Catalog CMS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.PRODUCT_MANAGER)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ==========================================
  // CATEGORIES
  // ==========================================
  @Post('categories')
  @ApiOperation({ summary: 'Create a new product category' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.productsService.createCategory(dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get hierarchical category tree' })
  getCategories() {
    return this.productsService.getCategories();
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.productsService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.deleteCategory(id);
  }

  // ==========================================
  // BRANDS
  // ==========================================
  @Post('brands')
  @ApiOperation({ summary: 'Create a product brand' })
  createBrand(@Body() dto: CreateBrandDto) {
    return this.productsService.createBrand(dto);
  }

  @Get('brands')
  @ApiOperation({ summary: 'Get all brands' })
  getBrands() {
    return this.productsService.getBrands();
  }

  @Patch('brands/:id')
  @ApiOperation({ summary: 'Update a brand' })
  updateBrand(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBrandDto) {
    return this.productsService.updateBrand(id, dto);
  }

  @Delete('brands/:id')
  @ApiOperation({ summary: 'Delete a brand' })
  deleteBrand(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.deleteBrand(id);
  }

  // ==========================================
  // PRODUCTS
  // ==========================================
  @Post()
  @ApiOperation({ summary: 'Create a base product' })
  createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of products' })
  getProducts(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('search') search?: string,
  ) {
    return this.productsService.getProducts(page || 1, limit || 10, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed product by ID' })
  getProductById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update base product' })
  updateProduct(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.deleteProduct(id);
  }

  // ==========================================
  // VARIANTS
  // ==========================================
  @Post(':productId/variants')
  @ApiOperation({ summary: 'Create a variant for a product' })
  createVariant(@Param('productId', ParseUUIDPipe) productId: string, @Body() dto: CreateVariantDto) {
    return this.productsService.createVariant(productId, dto);
  }

  @Patch('variants/:id')
  @ApiOperation({ summary: 'Update a variant' })
  updateVariant(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVariantDto) {
    return this.productsService.updateVariant(id, dto);
  }

  @Delete('variants/:id')
  @ApiOperation({ summary: 'Delete a variant' })
  deleteVariant(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.deleteVariant(id);
  }
}

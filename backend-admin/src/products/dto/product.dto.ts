import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, IsJSON } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '../../common/constants';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'iphone-15' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty({ example: 'Detailed description of the iPhone 15' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'Apple iPhone 15', required: false })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({ example: 'category-uuid' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({ example: 'brand-uuid' })
  @IsString()
  @IsNotEmpty()
  brandId!: string;

  @ApiProperty({ example: 999.99 })
  @IsNumber()
  basePrice!: number;

  @ApiProperty({ enum: ProductStatus, default: ProductStatus.DRAFT })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiProperty({ example: ['phone', 'apple', 'ios'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ example: '{"warranty": "1 year"}', required: false })
  @IsOptional()
  metadata?: any;
}

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  basePrice?: number;

  @ApiProperty({ enum: ProductStatus, required: false })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}

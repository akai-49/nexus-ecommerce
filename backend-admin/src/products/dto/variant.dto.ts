import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty({ example: 'IPHONE15-128GB-BLK' })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiProperty({ example: 999.99, required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ example: 1099.99, required: false })
  @IsNumber()
  @IsOptional()
  compareAtPrice?: number;

  @ApiProperty({ example: 600.00, required: false })
  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @ApiProperty({ example: 'Black', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: '128GB', required: false })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiProperty({ example: 0.18, required: false })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiProperty({ example: '14.7x7.1x0.78 cm', required: false })
  @IsString()
  @IsOptional()
  dimensions?: string;

  @ApiProperty({ example: ['https://example.com/iphone-black.png'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

export class UpdateVariantDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  compareAtPrice?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  dimensions?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: [], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

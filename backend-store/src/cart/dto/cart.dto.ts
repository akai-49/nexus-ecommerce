import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 'variant-uuid' })
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class UpdateQuantityDto {
  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(1)
  quantity!: number;
}

import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  @IsNotEmpty()
  @IsMongoId()
  foodItemId: string;

  @ApiProperty({ example: 2 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'Extra spicy please' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

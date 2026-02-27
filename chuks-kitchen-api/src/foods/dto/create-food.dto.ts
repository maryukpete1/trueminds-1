import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFoodDto {
  @ApiProperty({ example: 'Jollof Rice' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Signature Nigerian jollof rice with chicken' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 2500 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'Rice' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: 'https://example.com/jollof.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  preparationTime?: number;

  @ApiPropertyOptional({ example: ['spicy', 'popular'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

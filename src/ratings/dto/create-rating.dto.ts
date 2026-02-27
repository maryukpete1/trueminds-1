import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  @IsNotEmpty()
  @IsMongoId()
  orderId: string;

  @ApiPropertyOptional({ example: '60d21b4667d0d8992e610c86' })
  @IsOptional()
  @IsMongoId()
  foodItemId?: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Delicious food!' })
  @IsOptional()
  @IsString()
  comment?: string;
}

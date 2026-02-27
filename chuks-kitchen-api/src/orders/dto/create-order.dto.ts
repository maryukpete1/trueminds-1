import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeliveryAddressDto {
  @ApiProperty({ example: '123 Main Street' })
  @IsNotEmpty()
  @IsString()
  street: string;

  @ApiProperty({ example: 'Lagos' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Lagos' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiPropertyOptional({ example: 'Near the big market' })
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: DeliveryAddressDto })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress: DeliveryAddressDto;
}

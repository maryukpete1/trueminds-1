import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(0, { message: 'Quantity must be 0 or more. Set to 0 to remove item.' })
  quantity: number;
}

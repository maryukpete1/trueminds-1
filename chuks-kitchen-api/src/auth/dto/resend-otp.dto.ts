import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty()
  @IsString()
  email: string;
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate a completed order (1-5 stars)' })
  @ApiResponse({ status: 201, description: 'Rating submitted' })
  @ApiResponse({ status: 400, description: 'Already rated this order' })
  async create(
    @Req() req: AuthRequest,
    @Body() createRatingDto: CreateRatingDto,
  ) {
    return this.ratingsService.create(req.user.userId, createRatingDto);
  }

  @Get('food/:foodId')
  @ApiOperation({ summary: 'Get ratings for a food item' })
  @ApiResponse({ status: 200, description: 'Ratings returned with average' })
  async findByFoodItem(@Param('foodId') foodId: string) {
    return this.ratingsService.findByFoodItem(foodId);
  }
}

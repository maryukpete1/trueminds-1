import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Foods')
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  @ApiOperation({ summary: 'List all food items (with filters)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'available', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Food items returned' })
  async findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('available') available?: string,
  ) {
    return this.foodsService.findAll({
      category,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      available: available !== undefined ? available === 'true' : undefined,
    });
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all unique food categories' })
  @ApiResponse({ status: 200, description: 'Categories returned' })
  async getCategories() {
    const categories = await this.foodsService.findCategories();
    return { data: categories };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single food item by ID' })
  @ApiResponse({ status: 200, description: 'Food item returned' })
  @ApiResponse({ status: 404, description: 'Food item not found' })
  async findById(@Param('id') id: string) {
    return this.foodsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new food item (Admin only)' })
  @ApiResponse({ status: 201, description: 'Food item created' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async create(@Body() createFoodDto: CreateFoodDto) {
    return this.foodsService.create(createFoodDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a food item (Admin only)' })
  @ApiResponse({ status: 200, description: 'Food item updated' })
  @ApiResponse({ status: 404, description: 'Food item not found' })
  async update(
    @Param('id') id: string,
    @Body() updateFoodDto: UpdateFoodDto,
  ) {
    return this.foodsService.update(id, updateFoodDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a food item (Admin only - soft delete)' })
  @ApiResponse({ status: 200, description: 'Food item removed' })
  @ApiResponse({ status: 404, description: 'Food item not found' })
  async remove(@Param('id') id: string) {
    return this.foodsService.remove(id);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FoodItem, FoodItemDocument } from './schemas/food-item.schema';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';

@Injectable()
export class FoodsService {
  constructor(
    @InjectModel(FoodItem.name)
    private readonly foodItemModel: Model<FoodItemDocument>,
  ) {}

  async create(createFoodDto: CreateFoodDto): Promise<FoodItemDocument> {
    const food = new this.foodItemModel(createFoodDto);
    return food.save();
  }

  async findAll(query: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    available?: boolean;
  }) {
    const { category, search, page = 1, limit = 20, available } = query;
    const filter: Record<string, unknown> = {};

    if (category) {
      filter.category = { $regex: new RegExp(category, 'i') };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: new RegExp(search, 'i') } },
        { description: { $regex: new RegExp(search, 'i') } },
      ];
    }

    if (available !== undefined) {
      filter.isAvailable = available;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.foodItemModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.foodItemModel.countDocuments(filter).exec(),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findCategories(): Promise<string[]> {
    const categories = await this.foodItemModel.distinct('category').exec();
    return categories;
  }

  async findById(id: string): Promise<FoodItemDocument> {
    const food = await this.foodItemModel.findById(id).exec();
    if (!food) {
      throw new NotFoundException(`Food item with ID ${id} not found`);
    }
    return food;
  }

  async update(
    id: string,
    updateFoodDto: UpdateFoodDto,
  ): Promise<FoodItemDocument> {
    const food = await this.foodItemModel
      .findByIdAndUpdate(id, updateFoodDto, { new: true })
      .exec();
    if (!food) {
      throw new NotFoundException(`Food item with ID ${id} not found`);
    }
    return food;
  }

  async remove(id: string): Promise<{ message: string }> {
    const food = await this.foodItemModel.findById(id).exec();
    if (!food) {
      throw new NotFoundException(`Food item with ID ${id} not found`);
    }
    // Soft delete by marking as unavailable
    await this.foodItemModel
      .findByIdAndUpdate(id, { isAvailable: false })
      .exec();
    return { message: 'Food item removed successfully' };
  }
}

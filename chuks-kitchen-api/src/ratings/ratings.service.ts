import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Rating, RatingDocument } from './schemas/rating.schema';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectModel(Rating.name)
    private readonly ratingModel: Model<RatingDocument>,
  ) {}

  async create(
    userId: string,
    createRatingDto: CreateRatingDto,
  ): Promise<RatingDocument> {
    // Check for existing rating for this order by this user
    const existing = await this.ratingModel
      .findOne({
        userId: new Types.ObjectId(userId),
        orderId: new Types.ObjectId(createRatingDto.orderId),
      })
      .exec();

    if (existing) {
      throw new BadRequestException(
        'You have already rated this order',
      );
    }

    const rating = new this.ratingModel({
      userId: new Types.ObjectId(userId),
      orderId: new Types.ObjectId(createRatingDto.orderId),
      foodItemId: createRatingDto.foodItemId
        ? new Types.ObjectId(createRatingDto.foodItemId)
        : undefined,
      rating: createRatingDto.rating,
      comment: createRatingDto.comment,
    });

    return rating.save();
  }

  async findByFoodItem(foodItemId: string) {
    const ratings = await this.ratingModel
      .find({ foodItemId: new Types.ObjectId(foodItemId) })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .exec();

    const average =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    return {
      data: {
        ratings,
        average: Math.round(average * 10) / 10,
        total: ratings.length,
      },
    };
  }
}

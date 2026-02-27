import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Rating, RatingSchema } from './schemas/rating.schema';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rating.name, schema: RatingSchema }]),
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}

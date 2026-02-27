import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FoodItemDocument = FoodItem & Document;

@Schema({ timestamps: true })
export class FoodItem {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ default: '' })
  image: string;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ min: 0 })
  preparationTime?: number;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const FoodItemSchema = SchemaFactory.createForClass(FoodItem);

// Index for search and filtering
FoodItemSchema.index({ category: 1 });
FoodItemSchema.index({ name: 'text', description: 'text' });

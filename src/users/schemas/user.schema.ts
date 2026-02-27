import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  })
  email?: string;

  @Prop({ unique: true, sparse: true, trim: true })
  phoneNumber?: string;

  @Prop()
  password?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  referralCode?: string;

  @Prop()
  referredBy?: string;

  @Prop()
  otp?: string;

  @Prop()
  otpExpiresAt?: Date;

  @Prop()
  googleId?: string;

  @Prop()
  facebookId?: string;

  @Prop()
  profileImage?: string;

  @Prop({
    type: {
      street: String,
      city: String,
      state: String,
    },
  })
  address?: {
    street: string;
    city: string;
    state: string;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

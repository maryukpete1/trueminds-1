import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByPhone(phoneNumber: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phoneNumber }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async findByFacebookId(facebookId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ facebookId }).exec();
  }

  async create(userData: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async updateById(
    id: string,
    updateData: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async findByEmailOrPhone(
    email?: string,
    phoneNumber?: string,
  ): Promise<UserDocument | null> {
    const conditions: Record<string, string>[] = [];
    if (email) conditions.push({ email: email.toLowerCase() });
    if (phoneNumber) conditions.push({ phoneNumber });

    if (conditions.length === 0) return null;
    return this.userModel.findOne({ $or: conditions }).exec();
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { FoodsService } from '../foods/foods.service';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    private readonly foodsService: FoodsService,
  ) {}

  async getCart(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('items.foodItem', 'name image category isAvailable')
      .exec();

    if (!cart) {
      cart = await this.cartModel.create({
        userId: new Types.ObjectId(userId),
        items: [],
        totalAmount: 0,
      });
    }

    return cart;
  }

  async addToCart(
    userId: string,
    addToCartDto: AddToCartDto,
  ): Promise<CartDocument> {
    const { foodItemId, quantity, specialInstructions } = addToCartDto;

    // Validate food item exists and is available
    const foodItem = await this.foodsService.findById(foodItemId);
    if (!foodItem.isAvailable) {
      throw new BadRequestException(
        `"${foodItem.name}" is currently unavailable`,
      );
    }

    let cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!cart) {
      cart = new this.cartModel({
        userId: new Types.ObjectId(userId),
        items: [],
        totalAmount: 0,
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.foodItem.toString() === foodItemId,
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      if (specialInstructions) {
        cart.items[existingItemIndex].specialInstructions = specialInstructions;
      }
    } else {
      // Add new item
      cart.items.push({
        foodItem: new Types.ObjectId(foodItemId),
        quantity,
        price: foodItem.price,
        specialInstructions,
      } as any);
    }

    // Recalculate total
    cart.totalAmount = this.calculateTotal(cart);

    return cart.save();
  }

  async updateCartItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartDocument> {
    const cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex(
      (item) => (item as any)._id.toString() === itemId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    if (updateCartItemDto.quantity === 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = updateCartItemDto.quantity;
    }

    cart.totalAmount = this.calculateTotal(cart);
    return cart.save();
  }

  async removeCartItem(
    userId: string,
    itemId: string,
  ): Promise<CartDocument> {
    const cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex(
      (item) => (item as any)._id.toString() === itemId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    cart.items.splice(itemIndex, 1);
    cart.totalAmount = this.calculateTotal(cart);

    return cart.save();
  }

  async clearCart(userId: string): Promise<{ message: string }> {
    const cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!cart) {
      return { message: 'Cart is already empty' };
    }

    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    return { message: 'Cart cleared successfully' };
  }

  async getCartForOrder(userId: string): Promise<CartDocument | null> {
    return this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('items.foodItem')
      .exec();
  }

  private calculateTotal(cart: CartDocument): number {
    return cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, CancelOrderDto } from './dto/update-order-status.dto';
import { CartService } from '../cart/cart.service';
import { FoodItemDocument } from '../foods/schemas/food-item.schema';

// Valid status transitions
const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly cartService: CartService,
  ) {}

  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<OrderDocument> {
    // Get user's cart
    const cart = await this.cartService.getCartForOrder(userId);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException(
        'Cannot create order: Cart is empty. Add items to your cart first.',
      );
    }

    // Validate availability of all items
    const unavailableItems: string[] = [];
    for (const cartItem of cart.items) {
      const foodItem = cartItem.foodItem as unknown as FoodItemDocument;
      if (foodItem && !foodItem.isAvailable) {
        unavailableItems.push(foodItem.name || 'Unknown item');
      }
    }

    if (unavailableItems.length > 0) {
      throw new BadRequestException(
        `The following items are no longer available: ${unavailableItems.join(', ')}. Please remove them from your cart.`,
      );
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Build order items (snapshot from cart)
    const orderItems = cart.items.map((cartItem) => {
      const foodItem = cartItem.foodItem as unknown as FoodItemDocument;
      return {
        foodItem: new Types.ObjectId(
          (foodItem._id || cartItem.foodItem).toString(),
        ),
        name: foodItem?.name || 'Food Item',
        quantity: cartItem.quantity,
        price: cartItem.price,
      };
    });

    // Calculate total
    const totalAmount = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    // Create order
    const order = new this.orderModel({
      userId: new Types.ObjectId(userId),
      orderNumber,
      items: orderItems,
      totalAmount,
      status: OrderStatus.PENDING,
      deliveryAddress: createOrderDto.deliveryAddress,
      statusHistory: [
        {
          status: OrderStatus.PENDING,
          timestamp: new Date(),
          note: 'Order placed',
        },
      ],
    });

    const savedOrder = await order.save();

    // Clear the cart after successful order creation
    await this.cartService.clearCart(userId);

    this.logger.log(`Order ${orderNumber} created for user ${userId}`);

    return savedOrder;
  }

  async findAllByUser(
    userId: string,
    query: { status?: string; page?: number; limit?: number },
  ) {
    const { status, page = 1, limit = 10 } = query;
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(orderId: string, userId?: string): Promise<OrderDocument> {
    const filter: Record<string, unknown> = {
      _id: new Types.ObjectId(orderId),
    };
    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    const order = await this.orderModel.findOne(filter).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return order;
  }

  async updateStatus(
    orderId: string,
    updateStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const validNextStatuses = VALID_TRANSITIONS[order.status] || [];
    if (!validNextStatuses.includes(updateStatusDto.status)) {
      throw new BadRequestException(
        `Cannot transition from "${order.status}" to "${updateStatusDto.status}". Valid transitions: ${validNextStatuses.join(', ') || 'none'}`,
      );
    }

    order.status = updateStatusDto.status;
    order.statusHistory.push({
      status: updateStatusDto.status,
      timestamp: new Date(),
      note: updateStatusDto.note,
    });

    if (updateStatusDto.status === OrderStatus.CANCELLED) {
      order.cancelledBy = 'admin';
      order.cancellationReason =
        updateStatusDto.note || 'Cancelled by admin';
    }

    return order.save();
  }

  async cancelOrder(
    orderId: string,
    userId: string,
    cancelDto: CancelOrderDto,
  ): Promise<OrderDocument> {
    const order = await this.orderModel
      .findOne({
        _id: new Types.ObjectId(orderId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel order in "${order.status}" status. Orders can only be cancelled when "pending" or "confirmed".`,
      );
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledBy = 'customer';
    order.cancellationReason =
      cancelDto.reason || 'Cancelled by customer';
    order.statusHistory.push({
      status: OrderStatus.CANCELLED,
      timestamp: new Date(),
      note: `Customer cancelled: ${cancelDto.reason || 'No reason provided'}`,
    });

    return order.save();
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const count = await this.orderModel
      .countDocuments({ createdAt: { $gte: startOfDay } })
      .exec();
    const seq = String(count + 1).padStart(3, '0');
    return `CK-${dateStr}-${seq}`;
  }
}

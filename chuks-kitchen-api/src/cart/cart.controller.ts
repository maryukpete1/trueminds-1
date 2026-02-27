import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'View current cart' })
  @ApiResponse({ status: 200, description: 'Cart returned' })
  async getCart(@Req() req: AuthRequest) {
    return this.cartService.getCart(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a food item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  @ApiResponse({ status: 400, description: 'Food item unavailable' })
  async addToCart(
    @Req() req: AuthRequest,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  @Patch(':itemId')
  @ApiOperation({ summary: 'Update item quantity in cart (0 removes item)' })
  @ApiResponse({ status: 200, description: 'Cart item updated' })
  @ApiResponse({ status: 404, description: 'Item not found in cart' })
  async updateCartItem(
    @Req() req: AuthRequest,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(
      req.user.userId,
      itemId,
      updateCartItemDto,
    );
  }

  @Delete(':itemId')
  @ApiOperation({ summary: 'Remove a specific item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed from cart' })
  @ApiResponse({ status: 404, description: 'Item not found in cart' })
  async removeCartItem(
    @Req() req: AuthRequest,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeCartItem(req.user.userId, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  async clearCart(@Req() req: AuthRequest) {
    return this.cartService.clearCart(req.user.userId);
  }
}

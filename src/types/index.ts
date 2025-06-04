import { Role, OrderStatus } from '@prisma/client';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface IUserWithPassword extends IUser {
  password: string;
}

export interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product?: IProduct;
}

export interface IOrder {
  id: string;
  userId: string;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  items: IOrderItem[];
}

export interface IOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: IProduct;
}

export interface IWishlistItem {
  id: string;
  userId: string;
  productId: string;
  product?: IProduct;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartRequest {
  quantity: number;
}
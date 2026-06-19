import type { InferSelectModel } from 'drizzle-orm';
import type {
  users as usersTable,
  products as productsTable,
  categories as categoriesTable,
  orders as ordersTable,
  orderItems as orderItemsTable,
} from './db/schema';

// ============ Database Row Types (derived from Drizzle schema) ============
export type UserRow = InferSelectModel<typeof usersTable>;
export type ProductRow = InferSelectModel<typeof productsTable>;
export type CategoryRow = InferSelectModel<typeof categoriesTable>;
export type OrderRow = InferSelectModel<typeof ordersTable>;
export type OrderItemRow = InferSelectModel<typeof orderItemsTable>;

// ============ Client-Facing Product Type ============
// Transforms DB snake_case → camelCase and parses JSON fields
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  badge?: string;
  features?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
}

// ============ User Types ============
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============ Cart Types ============
export interface CartItem {
  product: Product;
  quantity: number;
}

// ============ Order Types ============
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
  estimatedDelivery: string;
}

// ============ Payment Types ============
// PaymentDetails removed — card data is now handled entirely by Stripe's
// PCI-compliant hosted checkout page. No raw card data touches this server.

// ============ API Response Types ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============ Row → Client Transformers ============

/** Transform a product DB row into the client-facing Product shape */
export function toClientProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    originalPrice: row.originalPrice ?? undefined,
    image: row.image,
    category: row.category,
    rating: row.rating,
    reviewCount: row.reviewCount,
    inStock: Boolean(row.inStock),
    badge: row.badge ?? undefined,
    features: row.features ? JSON.parse(row.features) : [],
  };
}

import {
  pgTable,
  text,
  real,
  integer,
  serial,
  timestamp,
  uniqueIndex,
  customType,
} from 'drizzle-orm/pg-core';

// Custom type for pgvector(1536)
const vector = customType<{ data: number[]; driverParam: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value) {
    return `[${value.join(',')}]`;
  },
  fromDriver(value) {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value.replace(/[\[\]]/g, '').split(',').map(Number);
      }
    }
    return value as number[];
  },
});

// ============ Users Table ============
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============ Products Table ============
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: real('price').notNull(),
  originalPrice: real('original_price'),
  image: text('image').notNull(),
  category: text('category').notNull(),
  rating: real('rating').notNull().default(0),
  reviewCount: integer('review_count').notNull().default(0),
  inStock: integer('in_stock').notNull().default(1),
  badge: text('badge'),
  features: text('features'), // JSON string of string[]
  embedding: vector('embedding'),
});

// ============ Categories Table ============
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').notNull(),
});

// ============ Cart Items Table ============
export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
}, (table) => [
  uniqueIndex('cart_items_user_product_idx').on(table.userId, table.productId),
]);

// ============ Orders Table ============
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subtotal: real('subtotal').notNull(),
  shipping: real('shipping').notNull(),
  tax: real('tax').notNull(),
  total: real('total').notNull(),
  status: text('status').notNull().default('pending'),
  paymentMethod: text('payment_method').notNull(),
  shippingAddress: text('shipping_address').notNull(), // JSON string
  stripeSessionId: text('stripe_session_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  estimatedDelivery: timestamp('estimated_delivery', { withTimezone: true }).notNull(),
});

// ============ Order Items Table ============
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  productImage: text('product_image').notNull(),
  price: real('price').notNull(),
  quantity: integer('quantity').notNull(),
});

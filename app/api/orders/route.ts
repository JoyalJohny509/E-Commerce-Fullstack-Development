import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pool } from '@/lib/db';
import { initializeDatabase } from '@/lib/db/init';
import { orders, orderItems, cartItems, products } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

function formatOrder(
  order: typeof orders.$inferSelect,
  items: (typeof orderItems.$inferSelect)[]
) {
  const createdAt = order.createdAt instanceof Date
    ? order.createdAt.toISOString()
    : order.createdAt;
  const estimatedDelivery = order.estimatedDelivery instanceof Date
    ? order.estimatedDelivery.toISOString()
    : order.estimatedDelivery;

  let parsedAddress: string | object = order.shippingAddress;
  if (typeof parsedAddress === 'string') {
    try {
      parsedAddress = JSON.parse(parsedAddress);
    } catch {
      // fallback
    }
  }

  return {
    id: order.id,
    userId: order.userId,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    tax: Number(order.tax),
    total: Number(order.total),
    status: order.status,
    paymentMethod: order.paymentMethod,
    shippingAddress: parsedAddress,
    items: items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      price: Number(item.price),
      quantity: Number(item.quantity),
    })),
    createdAt,
    estimatedDelivery,
  };
}

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await initializeDatabase();

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, session.userId))
      .orderBy(desc(orders.createdAt));

    const result = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        return formatOrder(order, items);
      })
    );

    return NextResponse.json({ success: true, orders: result });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { shippingAddress, paymentMethod } = await request.json();

    if (!shippingAddress || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Shipping address and payment method are required' },
        { status: 400 }
      );
    }

    await initializeDatabase();

    // Fetch cart items with product details using Drizzle join
    const cartRows = await db
      .select({
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        name: products.name,
        price: products.price,
        image: products.image,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, session.userId));

    if (cartRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }

    const subtotal = cartRows.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > 100 ? 0 : 9.99;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    const orderId = `ORD-${Date.now()}`;
    const createdAt = new Date();
    const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Use a raw transaction for atomicity (insert order + items + clear cart)
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert order
      await db.insert(orders).values({
        id: orderId,
        userId: session.userId,
        subtotal,
        shipping,
        tax,
        total,
        status: 'confirmed',
        paymentMethod,
        shippingAddress: JSON.stringify(shippingAddress),
        createdAt,
        estimatedDelivery,
      });

      // Insert order items
      await db.insert(orderItems).values(
        cartRows.map((item) => ({
          orderId,
          productId: item.productId,
          productName: item.name,
          productImage: item.image,
          price: item.price,
          quantity: item.quantity,
        }))
      );

      // Clear user's cart
      await db.delete(cartItems).where(eq(cartItems.userId, session.userId));

      await client.query('COMMIT');
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }

    const responseItems = cartRows.map((item) => ({
      productId: item.productId,
      productName: item.name,
      productImage: item.image,
      price: item.price,
      quantity: item.quantity,
    }));

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        userId: session.userId,
        subtotal,
        shipping,
        tax,
        total,
        status: 'confirmed',
        paymentMethod,
        shippingAddress,
        items: responseItems,
        createdAt: createdAt.toISOString(),
        estimatedDelivery: estimatedDelivery.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error placing order:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

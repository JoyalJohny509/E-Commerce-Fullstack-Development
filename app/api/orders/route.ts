import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface OrderRow {
  id: string;
  user_id: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: string;
  payment_method: string;
  shipping_address: string | object;
  created_at: string | Date;
  estimated_delivery: string | Date;
}

interface OrderItemRow {
  product_id: string;
  product_name: string;
  product_image: string;
  price: number;
  quantity: number;
}

interface CartItemRow {
  product_id: string;
  quantity: number;
  name: string;
  price: number;
  image: string;
}

function formatOrder(order: OrderRow, items: OrderItemRow[]) {
  const createdAt = order.created_at instanceof Date ? order.created_at.toISOString() : order.created_at;
  const estimatedDelivery = order.estimated_delivery instanceof Date ? order.estimated_delivery.toISOString() : order.estimated_delivery;

  let parsedAddress = order.shipping_address;
  if (typeof parsedAddress === 'string') {
    try {
      parsedAddress = JSON.parse(parsedAddress);
    } catch {
      // fallback
    }
  }

  return {
    id: order.id,
    userId: order.user_id,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    tax: Number(order.tax),
    total: Number(order.total),
    status: order.status,
    paymentMethod: order.payment_method,
    shippingAddress: parsedAddress,
    items: items.map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      productImage: item.product_image,
      price: Number(item.price),
      quantity: Number(item.quantity),
    })),
    createdAt: createdAt,
    estimatedDelivery: estimatedDelivery,
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

    const db = getDb();
    await initializeDatabase();
    
    const ordersResult = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [session.userId]
    );
    const orders = ordersResult.rows as OrderRow[];

    const result = await Promise.all(
      orders.map(async (order) => {
        const itemsResult = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
        return formatOrder(order, itemsResult.rows as OrderItemRow[]);
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

    const db = getDb();
    await initializeDatabase();

    const cartItemsResult = await db.query(
      `SELECT ci.product_id, ci.quantity, p.name, p.price, p.image
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [session.userId]
    );
    const cartItems = cartItemsResult.rows as CartItemRow[];

    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > 100 ? 0 : 9.99;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    const orderId = `ORD-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      await client.query(
        `INSERT INTO orders (id, user_id, subtotal, shipping, tax, total, status, payment_method, shipping_address, created_at, estimated_delivery)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          orderId,
          session.userId,
          subtotal,
          shipping,
          tax,
          total,
          'confirmed',
          paymentMethod,
          JSON.stringify(shippingAddress),
          createdAt,
          estimatedDelivery
        ]
      );

      for (const item of cartItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [orderId, item.product_id, item.name, item.image, item.price, item.quantity]
        );
      }

      await client.query('DELETE FROM cart_items WHERE user_id = $1', [session.userId]);
      
      await client.query('COMMIT');
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }

    const orderItems = cartItems.map((item) => ({
      productId: item.product_id,
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
        items: orderItems,
        createdAt,
        estimatedDelivery,
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

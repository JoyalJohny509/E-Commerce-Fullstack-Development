import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
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
  shipping_address: string;
  created_at: string;
  estimated_delivery: string;
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
  return {
    id: order.id,
    userId: order.user_id,
    subtotal: order.subtotal,
    shipping: order.shipping,
    tax: order.tax,
    total: order.total,
    status: order.status,
    paymentMethod: order.payment_method,
    shippingAddress: JSON.parse(order.shipping_address),
    items: items.map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      productImage: item.product_image,
      price: item.price,
      quantity: item.quantity,
    })),
    createdAt: order.created_at,
    estimatedDelivery: order.estimated_delivery,
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
    const orders = db
      .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
      .all(session.userId) as OrderRow[];

    const getOrderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');

    const result = orders.map((order) => {
      const items = getOrderItems.all(order.id) as OrderItemRow[];
      return formatOrder(order, items);
    });

    return NextResponse.json({ success: true, orders: result });
  } catch {
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

    const cartItems = db
      .prepare(
        `SELECT ci.product_id, ci.quantity, p.name, p.price, p.image
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.user_id = ?`
      )
      .all(session.userId) as CartItemRow[];

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

    const insertOrder = db.prepare(
      `INSERT INTO orders (id, user_id, subtotal, shipping, tax, total, status, payment_method, shipping_address, created_at, estimated_delivery)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const insertOrderItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    const clearCart = db.prepare('DELETE FROM cart_items WHERE user_id = ?');

    const placeOrder = db.transaction(() => {
      insertOrder.run(
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
      );

      for (const item of cartItems) {
        insertOrderItem.run(orderId, item.product_id, item.name, item.image, item.price, item.quantity);
      }

      clearCart.run(session.userId);
    });

    placeOrder();

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
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const db = getDb();
    await initializeDatabase();

    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, session.userId]
    );
    const order = orderResult.rows[0] as OrderRow | undefined;

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const itemsResult = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    const items = itemsResult.rows as OrderItemRow[];

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

    return NextResponse.json({
      success: true,
      order: {
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
      },
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

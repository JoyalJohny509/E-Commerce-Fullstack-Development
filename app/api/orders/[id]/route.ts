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

    const order = db
      .prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
      .get(id, session.userId) as OrderRow | undefined;

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(order.id) as OrderItemRow[];

    return NextResponse.json({
      success: true,
      order: {
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
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

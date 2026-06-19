import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/db/init';
import { orders, orderItems } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

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
    await initializeDatabase();

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.userId, session.userId)))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

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

    return NextResponse.json({
      success: true,
      order: {
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

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/db/init';
import { cartItems } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { getUserCart } from '../route';
import { eq, and } from 'drizzle-orm';

// PATCH /api/cart/:productId - Update quantity for a specific cart item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { productId } = await params;
    const body = await request.json();
    const { quantity } = body;

    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        { success: false, error: 'quantity is required' },
        { status: 400 }
      );
    }

    await initializeDatabase();

    const condition = and(eq(cartItems.userId, user.userId), eq(cartItems.productId, productId));

    if (quantity <= 0) {
      // Delete the item if quantity is zero or negative
      await db.delete(cartItems).where(condition);
    } else {
      // Update the quantity
      await db.update(cartItems).set({ quantity }).where(condition);
    }

    const items = await getUserCart(user.userId);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/:productId - Remove a specific item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { productId } = await params;
    await initializeDatabase();

    await db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, user.userId), eq(cartItems.productId, productId)));

    const items = await getUserCart(user.userId);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}

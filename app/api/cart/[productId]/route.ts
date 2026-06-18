import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getUserCart } from '../route';

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

    const db = getDb();

    if (quantity <= 0) {
      // Delete the item if quantity is zero or negative
      db.prepare(
        'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?'
      ).run(user.userId, productId);
    } else {
      // Update the quantity
      db.prepare(
        'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?'
      ).run(quantity, user.userId, productId);
    }

    const items = getUserCart(db, user.userId);

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
    const db = getDb();

    db.prepare(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?'
    ).run(user.userId, productId);

    const items = getUserCart(db, user.userId);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}

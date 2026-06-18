import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

function getUserCart(db: any, userId: string) {
  const rows = db
    .prepare(
      `SELECT ci.quantity, p.id, p.name, p.description, p.price, p.original_price,
              p.image, p.category, p.rating, p.review_count, p.in_stock, p.badge, p.features
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?`
    )
    .all(userId);

  return rows.map((row: any) => ({
    quantity: row.quantity,
    product: {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      originalPrice: row.original_price,
      image: row.image,
      category: row.category,
      rating: row.rating,
      reviewCount: row.review_count,
      inStock: Boolean(row.in_stock),
      badge: row.badge,
      features: row.features ? JSON.parse(row.features) : [],
    },
  }));
}

export { getUserCart };

// GET /api/cart - Get current user's cart items
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    const items = getUserCart(db, user.userId);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart or increment quantity
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'productId is required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify the product exists
    const product = db
      .prepare('SELECT id FROM products WHERE id = ?')
      .get(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if item already exists in cart
    const existingItem = db
      .prepare(
        'SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?'
      )
      .get(user.userId, productId) as any;

    if (existingItem) {
      // Increment quantity
      db.prepare(
        'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?'
      ).run(quantity, user.userId, productId);
    } else {
      // Insert new row
      db.prepare(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)'
      ).run(user.userId, productId, quantity);
    }

    const items = getUserCart(db, user.userId);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear entire cart
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(user.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}

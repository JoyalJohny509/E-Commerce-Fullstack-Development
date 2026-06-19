import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/db/init';
import { cartItems, products } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { toClientProduct } from '@/lib/types';

/**
 * Fetch the current user's cart with full product details.
 * Exported so the [productId] sub-route can reuse it.
 */
export async function getUserCart(userId: string) {
  const rows = await db
    .select({
      quantity: cartItems.quantity,
      product: {
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        originalPrice: products.originalPrice,
        image: products.image,
        category: products.category,
        rating: products.rating,
        reviewCount: products.reviewCount,
        inStock: products.inStock,
        badge: products.badge,
        features: products.features,
        embedding: products.embedding,
      },
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));

  return rows.map((row) => ({
    quantity: row.quantity,
    product: toClientProduct(row.product),
  }));
}

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

    await initializeDatabase();
    const items = await getUserCart(user.userId);

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

    await initializeDatabase();

    // Verify the product exists
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if item already exists in cart
    const [existingItem] = await db
      .select({ quantity: cartItems.quantity })
      .from(cartItems)
      .where(and(eq(cartItems.userId, user.userId), eq(cartItems.productId, productId)))
      .limit(1);

    if (existingItem) {
      // Increment quantity
      await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + quantity })
        .where(and(eq(cartItems.userId, user.userId), eq(cartItems.productId, productId)));
    } else {
      // Insert new row
      await db.insert(cartItems).values({
        userId: user.userId,
        productId,
        quantity,
      });
    }

    const items = await getUserCart(user.userId);

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

    await initializeDatabase();
    await db.delete(cartItems).where(eq(cartItems.userId, user.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/db/init';
import { products } from '@/lib/db/schema';
import { toClientProduct } from '@/lib/types';
import { eq, and, ne } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await initializeDatabase();

    // Query product by id
    const [row] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = toClientProduct(row);

    // Query related products (same category, different id, limit 4)
    const relatedRows = await db
      .select()
      .from(products)
      .where(and(eq(products.category, row.category), ne(products.id, id)))
      .limit(4);

    const relatedProducts = relatedRows.map(toClientProduct);

    return NextResponse.json({
      success: true,
      product,
      relatedProducts,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

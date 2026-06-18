import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    // Query product by id
    const row = db
      .prepare(
        `SELECT id, name, description, price, original_price, image,
                category, rating, review_count, in_stock, badge, features
         FROM products
         WHERE id = ?`
      )
      .get(id) as any;

    if (!row) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = {
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
    };

    // Query related products (same category, different id, limit 4)
    const relatedRows = db
      .prepare(
        `SELECT id, name, description, price, original_price, image,
                category, rating, review_count, in_stock, badge, features
         FROM products
         WHERE category = ? AND id != ?
         LIMIT 4`
      )
      .all(row.category, id) as any[];

    const relatedProducts = relatedRows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      price: r.price,
      originalPrice: r.original_price,
      image: r.image,
      category: r.category,
      rating: r.rating,
      reviewCount: r.review_count,
      inStock: Boolean(r.in_stock),
      badge: r.badge,
      features: r.features ? JSON.parse(r.features) : [],
    }));

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

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'featured';

    // Build product query dynamically
    const conditions: string[] = [];
    const queryParams: string[] = [];

    if (category) {
      conditions.push('p.category = ?');
      queryParams.push(category);
    }

    if (search) {
      conditions.push(
        '(p.name LIKE ? OR p.description LIKE ? OR p.category LIKE ?)'
      );
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Determine ORDER BY clause
    let orderByClause: string;
    switch (sort) {
      case 'price-low':
        orderByClause = 'ORDER BY p.price ASC';
        break;
      case 'price-high':
        orderByClause = 'ORDER BY p.price DESC';
        break;
      case 'rating':
        orderByClause = 'ORDER BY p.rating DESC';
        break;
      case 'name':
        orderByClause = 'ORDER BY p.name ASC';
        break;
      case 'featured':
      default:
        orderByClause = 'ORDER BY p.id ASC';
        break;
    }

    const productsQuery = `
      SELECT p.id, p.name, p.description, p.price, p.original_price,
             p.image, p.category, p.rating, p.review_count, p.in_stock,
             p.badge, p.features
      FROM products p
      ${whereClause}
      ${orderByClause}
    `;

    const rows = db.prepare(productsQuery).all(...queryParams) as any[];

    const products = rows.map((row) => ({
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
    }));

    // Query categories with product counts from categories table
    const categoriesQuery = `
      SELECT c.id, c.name, c.slug, c.icon, COUNT(p.id) as count
      FROM categories c
      LEFT JOIN products p ON p.category = c.slug
      GROUP BY c.id, c.name, c.slug, c.icon
      ORDER BY c.name ASC
    `;

    const categories = db.prepare(categoriesQuery).all().map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      icon: row.icon,
      count: Number(row.count),
    }));

    return NextResponse.json({
      success: true,
      products,
      categories,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

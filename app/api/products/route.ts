import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/db/init';
import { products, categories } from '@/lib/db/schema';
import { toClientProduct } from '@/lib/types';
import { eq, ilike, asc, desc, sql, and, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'featured';

    // Build dynamic where conditions
    const conditions = [];

    if (category) {
      conditions.push(eq(products.category, category));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        sql`(${products.name} ILIKE ${searchTerm} OR ${products.description} ILIKE ${searchTerm} OR ${products.category} ILIKE ${searchTerm})`
      );
    }

    // Determine ORDER BY
    let orderBy;
    switch (sort) {
      case 'price-low':
        orderBy = asc(products.price);
        break;
      case 'price-high':
        orderBy = desc(products.price);
        break;
      case 'rating':
        orderBy = desc(products.rating);
        break;
      case 'name':
        orderBy = asc(products.name);
        break;
      case 'featured':
      default:
        orderBy = asc(products.id);
        break;
    }

    // Query products
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const productRows = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(orderBy);

    const clientProducts = productRows.map(toClientProduct);

    // Query categories with product counts
    const categoryRows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        count: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(products.category, categories.slug))
      .groupBy(categories.id, categories.name, categories.slug, categories.icon)
      .orderBy(asc(categories.name));

    const clientCategories = categoryRows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      icon: row.icon,
      count: Number(row.count),
    }));

    return NextResponse.json({
      success: true,
      products: clientProducts,
      categories: clientCategories,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

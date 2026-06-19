import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch } from '@/lib/ai/search';
import { initializeDatabase } from '@/lib/db/init';

export async function GET(request: NextRequest) {
  try {
    // Ensure database and schema are initialized
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim() === '') {
      return NextResponse.json({
        success: true,
        products: [],
        summary: null,
        metadata: {
          query: '',
          queryEmbeddingTimeMs: 0,
          searchTimeMs: 0,
          totalResults: 0,
          aiAvailable: false,
          guardrailApplied: false,
        },
      });
    }

    const result = await semanticSearch(query);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Semantic search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform semantic search',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

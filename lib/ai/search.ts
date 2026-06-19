import { pool } from '@/lib/db';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { toClientProduct, Product } from '@/lib/types';
import { generateEmbedding, buildProductEmbeddingText, isAIAvailable } from './embeddings';
import OpenAI from 'openai';

/**
 * Minimum cosine similarity threshold for a product match.
 * Results below this score are discarded to prevent weak/irrelevant matches.
 * 0.3 is a reasonable threshold for text-embedding-3-small with product data.
 */
const SIMILARITY_THRESHOLD = 0.3;

/**
 * Maximum number of results to return from semantic search.
 */
const MAX_RESULTS = 8;

export interface SemanticSearchResult {
  products: (Product & { similarityScore: number })[];
  summary: string | null;
  metadata: {
    query: string;
    queryEmbeddingTimeMs: number;
    searchTimeMs: number;
    totalResults: number;
    aiAvailable: boolean;
    guardrailApplied: boolean;
  };
}

/**
 * Perform semantic search against the product catalog using pgvector.
 *
 * Pipeline:
 * 1. Embed the user's natural language query
 * 2. Perform cosine similarity search against product embeddings
 * 3. Apply similarity score threshold
 * 4. Optionally generate an LLM summary grounded in retrieved results
 * 5. Self-consistency check: validate summary only references retrieved products
 *
 * Anti-hallucination guardrails:
 * - The LLM never generates product information
 * - Results come ONLY from the database
 * - Summary is grounded in retrieved products with explicit instructions
 * - Summary is discarded if it references products not in the retrieved set
 */
export async function semanticSearch(query: string): Promise<SemanticSearchResult> {
  if (!isAIAvailable()) {
    return {
      products: [],
      summary: null,
      metadata: {
        query,
        queryEmbeddingTimeMs: 0,
        searchTimeMs: 0,
        totalResults: 0,
        aiAvailable: false,
        guardrailApplied: false,
      },
    };
  }

  // Step 1: Embed the query
  const embedStart = performance.now();
  const queryEmbedding = await generateEmbedding(query);
  const queryEmbeddingTimeMs = Math.round(performance.now() - embedStart);

  // Step 2: Cosine similarity search using pgvector
  const searchStart = performance.now();
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const result = await pool.query(
    `SELECT id, name, description, price, original_price, image,
            category, rating, review_count, in_stock, badge, features,
            1 - (embedding <=> $1::vector) AS similarity
     FROM products
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [embeddingStr, MAX_RESULTS]
  );
  const searchTimeMs = Math.round(performance.now() - searchStart);

  // Step 3: Apply similarity threshold
  const matchedRows = result.rows.filter(
    (row: any) => row.similarity >= SIMILARITY_THRESHOLD
  );

  const matchedProducts = matchedRows.map((row: any) => ({
    ...toClientProduct(row),
    similarityScore: Math.round(row.similarity * 1000) / 1000,
  }));

  // Step 4: Generate grounded LLM summary (optional)
  let summary: string | null = null;
  let guardrailApplied = false;

  if (matchedProducts.length > 0) {
    try {
      const { generatedSummary, wasFiltered } = await generateGroundedSummary(
        query,
        matchedProducts
      );
      summary = generatedSummary;
      guardrailApplied = wasFiltered;
    } catch (err) {
      console.error('LLM summary generation failed:', err);
      // Graceful degradation: return results without summary
    }
  }

  return {
    products: matchedProducts,
    summary,
    metadata: {
      query,
      queryEmbeddingTimeMs,
      searchTimeMs,
      totalResults: matchedProducts.length,
      aiAvailable: true,
      guardrailApplied,
    },
  };
}

/**
 * Generate a natural-language summary grounded in the retrieved products.
 *
 * Self-consistency guardrail: If the summary mentions a product name
 * not present in the retrieved set, the summary is discarded.
 */
async function generateGroundedSummary(
  query: string,
  products: (Product & { similarityScore: number })[]
): Promise<{ generatedSummary: string | null; wasFiltered: boolean }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const productList = products
    .map(
      (p, i) =>
        `${i + 1}. "${p.name}" — $${p.price} — ${p.category} — ${p.description.slice(0, 100)}...`
    )
    .join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a helpful shopping assistant for LUXE Store. You MUST follow these rules strictly:
1. ONLY describe products from the provided list below. Do NOT invent, fabricate, or hallucinate any products, features, prices, or details.
2. Be concise (2-3 sentences max).
3. Highlight why the products match the user's query.
4. If the products don't clearly match the query, say so honestly.
5. Never recommend products that are not in the list.

Available products:
${productList}`,
      },
      {
        role: 'user',
        content: `Customer searched for: "${query}". Summarize the matching products.`,
      },
    ],
    temperature: 0.3, // Low temperature for factual consistency
    max_tokens: 200,
  });

  const generatedText = response.choices[0]?.message?.content?.trim() || null;

  if (!generatedText) {
    return { generatedSummary: null, wasFiltered: false };
  }

  // Self-consistency check: verify summary only references known products
  const knownNames = products.map((p) => p.name.toLowerCase());
  const summaryLower = generatedText.toLowerCase();

  // Check if the summary mentions any product-like names that aren't in our set
  // Simple heuristic: look for quoted product names in the summary
  const quotedNames = summaryLower.match(/"([^"]+)"/g) || [];
  const unknownReferences = quotedNames.filter((quoted) => {
    const name = quoted.replace(/"/g, '');
    return !knownNames.some((known) => known.includes(name) || name.includes(known));
  });

  if (unknownReferences.length > 0) {
    console.warn(
      `Guardrail: Summary referenced unknown products: ${unknownReferences.join(', ')}. Discarding summary.`
    );
    return { generatedSummary: null, wasFiltered: true };
  }

  return { generatedSummary: generatedText, wasFiltered: false };
}

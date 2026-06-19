import OpenAI from 'openai';

/**
 * OpenAI client for embedding generation.
 * Gracefully handles missing API key for environments
 * where AI search is not yet configured.
 */
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Model: text-embedding-3-small
 * Dimensions: 1536
 * Cost: ~$0.02 per million tokens (essentially free for 8 products)
 */
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

export { EMBEDDING_DIMENSIONS };

/**
 * Generate a vector embedding for the given text.
 * Returns a 1536-dimensional float array.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error(
      'OpenAI API key is not configured. Set OPENAI_API_KEY in .env.local'
    );
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.trim(),
  });

  return response.data[0].embedding;
}

/**
 * Build a rich text representation of a product for embedding.
 * Combines name, description, category, and features into a single
 * string optimized for semantic similarity search.
 */
export function buildProductEmbeddingText(product: {
  name: string;
  description: string;
  category: string;
  features?: string | string[] | null;
}): string {
  const featuresList = Array.isArray(product.features)
    ? product.features
    : product.features
      ? JSON.parse(product.features)
      : [];

  const parts = [
    product.name,
    product.description,
    `Category: ${product.category}`,
  ];

  if (featuresList.length > 0) {
    parts.push(`Features: ${featuresList.join(', ')}`);
  }

  return parts.join('. ');
}

/**
 * Check if the OpenAI client is available.
 */
export function isAIAvailable(): boolean {
  return openai !== null;
}

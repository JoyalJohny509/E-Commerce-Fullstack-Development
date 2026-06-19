import { loadEnvConfig } from '@next/env';
// Load environment variables before importing other modules
loadEnvConfig(process.cwd());

import { db } from '../lib/db';
import { products } from '../lib/db/schema';
import { generateEmbedding, buildProductEmbeddingText, isAIAvailable } from '../lib/ai/embeddings';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Starting product embedding generation...');

  if (!isAIAvailable()) {
    console.error('Error: OpenAI API key is not configured.');
    console.error('Please set OPENAI_API_KEY in .env.local and run again.');
    process.exit(1);
  }

  // Fetch all products
  const allProducts = await db.select().from(products);
  console.log(`Found ${allProducts.length} products in database.`);

  let successCount = 0;
  let failCount = 0;

  for (const product of allProducts) {
    console.log(`Processing product: "${product.name}" (ID: ${product.id})...`);
    try {
      const textToEmbed = buildProductEmbeddingText({
        name: product.name,
        description: product.description,
        category: product.category,
        features: product.features,
      });

      const embedding = await generateEmbedding(textToEmbed);

      await db
        .update(products)
        .set({ embedding })
        .where(eq(products.id, product.id));

      console.log(`✅ Successfully generated and saved embedding for "${product.name}"`);
      successCount++;
    } catch (err) {
      console.error(`❌ Failed to generate embedding for "${product.name}":`, err);
      failCount++;
    }
  }

  console.log('\nEmbedding generation completed.');
  console.log(`Success: ${successCount}`);
  console.log(`Failure: ${failCount}`);
  
  // Close pool connections by forcing exit
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Unhandled error in generation script:', err);
  process.exit(1);
});

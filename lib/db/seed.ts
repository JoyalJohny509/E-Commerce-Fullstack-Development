import { db } from './index';
import { users, products, categories } from './schema';
import { eq, sql } from 'drizzle-orm';
import bcryptjs from 'bcryptjs';
import { generateEmbedding, buildProductEmbeddingText, isAIAvailable } from '../ai/embeddings';

/**
 * Seeds the database with initial categories, products, and a demo user.
 * Only runs if the products table is empty (idempotent).
 */
export async function seedDatabase(): Promise<void> {
  // Check if already seeded
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products);
  const count = Number(countResult[0].count);

  if (count > 0) return;

  console.log('Seeding PostgreSQL database...');

  // Seed categories
  await db.insert(categories).values([
    { id: 'cat-1', name: 'Electronics', slug: 'electronics', icon: '🔌' },
    { id: 'cat-2', name: 'Accessories', slug: 'accessories', icon: '👜' },
    { id: 'cat-3', name: 'Fashion', slug: 'fashion', icon: '👟' },
  ]).onConflictDoNothing();

  // Seed products
  const productData = [
    {
      id: 'prod-001',
      name: 'Nova Pro Wireless Headphones',
      description: 'Experience studio-quality sound with active noise cancellation, 40-hour battery life, and ultra-comfortable memory foam ear cushions. Perfect for audiophiles and professionals alike.',
      price: 299.99,
      originalPrice: 399.99,
      image: '/products/headphones.png',
      category: 'electronics',
      rating: 4.8,
      reviewCount: 2341,
      inStock: 1,
      badge: 'Best Seller',
      features: JSON.stringify(['Active Noise Cancellation', '40-hour battery life', 'Hi-Res Audio certified', 'Memory foam ear cushions', 'Multi-device connectivity']),
    },
    {
      id: 'prod-002',
      name: 'Aura Elite Smartwatch',
      description: 'Stay connected and track your health with this premium smartwatch featuring AMOLED display, heart rate monitoring, GPS, and 7-day battery life in a stunning rose gold finish.',
      price: 449.99,
      originalPrice: 549.99,
      image: '/products/smartwatch.png',
      category: 'electronics',
      rating: 4.7,
      reviewCount: 1876,
      inStock: 1,
      badge: 'New Arrival',
      features: JSON.stringify(['1.4" AMOLED Display', 'Heart rate & SpO2 monitoring', 'Built-in GPS', '7-day battery life', '5ATM water resistance']),
    },
    {
      id: 'prod-003',
      name: 'Heritage Leather Messenger Bag',
      description: 'Handcrafted from full-grain Italian leather, this messenger bag combines timeless style with modern functionality. Features padded laptop compartment and multiple organizer pockets.',
      price: 189.99,
      originalPrice: 249.99,
      image: '/products/bag.png',
      category: 'accessories',
      rating: 4.9,
      reviewCount: 987,
      inStock: 1,
      badge: 'Premium',
      features: JSON.stringify(['Full-grain Italian leather', 'Fits 15" laptops', 'Brass hardware', 'Adjustable shoulder strap', 'Interior organizer pockets']),
    },
    {
      id: 'prod-004',
      name: 'Cloud Runner Sneakers',
      description: 'Ultra-lightweight running shoes with responsive cushioning and breathable mesh upper. Engineered for comfort whether you are hitting the track or the streets.',
      price: 159.99,
      originalPrice: null,
      image: '/products/sneakers.png',
      category: 'fashion',
      rating: 4.6,
      reviewCount: 3201,
      inStock: 1,
      badge: null,
      features: JSON.stringify(['Ultra-lightweight design', 'Responsive cushioning', 'Breathable mesh upper', 'Non-slip rubber outsole', 'Reflective details']),
    },
    {
      id: 'prod-005',
      name: 'Zenith Aviator Sunglasses',
      description: 'Classic aviator design with polarized lenses and a lightweight titanium frame. UV400 protection meets vintage-inspired luxury in this timeless accessory.',
      price: 219.99,
      originalPrice: 279.99,
      image: '/products/sunglasses.png',
      category: 'accessories',
      rating: 4.5,
      reviewCount: 1456,
      inStock: 1,
      badge: 'Trending',
      features: JSON.stringify(['Polarized lenses', 'Titanium frame', 'UV400 protection', 'Anti-reflective coating', 'Premium leather case included']),
    },
    {
      id: 'prod-006',
      name: 'Lumix Pro Mirrorless Camera',
      description: 'Capture stunning photos and 4K video with this professional-grade mirrorless camera. Features a 24.2MP sensor, in-body stabilization, and weather-sealed construction.',
      price: 1299.99,
      originalPrice: 1499.99,
      image: '/products/camera.png',
      category: 'electronics',
      rating: 4.9,
      reviewCount: 654,
      inStock: 1,
      badge: 'Pro Choice',
      features: JSON.stringify(['24.2MP Full-Frame sensor', '4K 60fps video', '5-axis in-body stabilization', 'Weather-sealed body', 'Dual card slots']),
    },
    {
      id: 'prod-007',
      name: 'Pulse Portable Speaker',
      description: 'Take your music anywhere with this waterproof Bluetooth speaker. Rich 360° sound, 20-hour battery, and a rugged design that is ready for any adventure.',
      price: 79.99,
      originalPrice: null,
      image: '/products/speaker.png',
      category: 'electronics',
      rating: 4.4,
      reviewCount: 4521,
      inStock: 1,
      badge: null,
      features: JSON.stringify(['360° immersive sound', '20-hour battery life', 'IP67 waterproof', 'Built-in microphone', 'USB-C fast charging']),
    },
    {
      id: 'prod-008',
      name: 'Monarch Slim Wallet',
      description: 'Minimalist design meets premium craftsmanship. This slim wallet holds up to 8 cards and features RFID-blocking technology, all wrapped in buttery-soft Nappa leather.',
      price: 69.99,
      originalPrice: 89.99,
      image: '/products/wallet.png',
      category: 'accessories',
      rating: 4.7,
      reviewCount: 2109,
      inStock: 1,
      badge: null,
      features: JSON.stringify(['Nappa leather construction', 'RFID-blocking technology', 'Holds up to 8 cards', 'Slim profile design', 'Gift box included']),
    },
  ];

  const seededProducts = [];
  const aiAvailable = isAIAvailable();

  if (aiAvailable) {
    console.log('OpenAI API key detected. Generating embeddings for seeded products...');
  } else {
    console.log('OpenAI API key NOT detected. Seeding products with null embeddings.');
  }

  for (const p of productData) {
    let embedding: number[] | null = null;
    if (aiAvailable) {
      try {
        const textToEmbed = buildProductEmbeddingText(p);
        embedding = await generateEmbedding(textToEmbed);
        console.log(`Generated embedding for "${p.name}"`);
      } catch (err) {
        console.error(`Failed to generate embedding for "${p.name}" during seeding:`, err);
      }
    }
    seededProducts.push({
      ...p,
      embedding,
    });
  }

  await db.insert(products).values(seededProducts).onConflictDoNothing();

  // Seed demo user
  const passwordHash = bcryptjs.hashSync('demo123', 10);
  await db.insert(users).values({
    id: 'user-demo',
    name: 'Demo User',
    email: 'demo@luxestore.com',
    passwordHash,
  }).onConflictDoNothing();

  console.log('Database seeded successfully.');
}

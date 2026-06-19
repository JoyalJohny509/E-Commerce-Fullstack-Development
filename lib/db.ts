import { Pool } from 'pg';
import bcryptjs from 'bcryptjs';

// Global cache for connection pool in development
let globalPool = global as typeof globalThis & {
  pgPool?: Pool;
};

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  if (!globalPool.pgPool) {
    globalPool.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  pool = globalPool.pgPool;
}

let initPromise: Promise<void> | null = null;

async function seedDatabase(): Promise<void> {
  const row = await pool.query('SELECT COUNT(*) as count FROM products');
  const count = parseInt(row.rows[0].count, 10);
  if (count > 0) return;

  console.log('Seeding PostgreSQL database...');
  
  // Seed categories
  await pool.query('INSERT INTO categories (id, name, slug, icon) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', ['cat-1', 'Electronics', 'electronics', '🔌']);
  await pool.query('INSERT INTO categories (id, name, slug, icon) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', ['cat-2', 'Accessories', 'accessories', '👜']);
  await pool.query('INSERT INTO categories (id, name, slug, icon) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', ['cat-3', 'Fashion', 'fashion', '👟']);

  // Seed products
  const insertProductQuery = `
    INSERT INTO products (id, name, description, price, original_price, image, category, rating, review_count, in_stock, badge, features)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT DO NOTHING
  `;

  await pool.query(insertProductQuery, [
    'prod-001',
    'Nova Pro Wireless Headphones',
    'Experience studio-quality sound with active noise cancellation, 40-hour battery life, and ultra-comfortable memory foam ear cushions. Perfect for audiophiles and professionals alike.',
    299.99, 399.99, '/products/headphones.png', 'electronics', 4.8, 2341, 1, 'Best Seller',
    '["Active Noise Cancellation","40-hour battery life","Hi-Res Audio certified","Memory foam ear cushions","Multi-device connectivity"]'
  ]);

  await pool.query(insertProductQuery, [
    'prod-002',
    'Aura Elite Smartwatch',
    'Stay connected and track your health with this premium smartwatch featuring AMOLED display, heart rate monitoring, GPS, and 7-day battery life in a stunning rose gold finish.',
    449.99, 549.99, '/products/smartwatch.png', 'electronics', 4.7, 1876, 1, 'New Arrival',
    '["1.4\\" AMOLED Display","Heart rate & SpO2 monitoring","Built-in GPS","7-day battery life","5ATM water resistance"]'
  ]);

  await pool.query(insertProductQuery, [
    'prod-003',
    'Heritage Leather Messenger Bag',
    'Handcrafted from full-grain Italian leather, this messenger bag combines timeless style with modern functionality. Features padded laptop compartment and multiple organizer pockets.',
    189.99, 249.99, '/products/bag.png', 'accessories', 4.9, 987, 1, 'Premium',
    '["Full-grain Italian leather","Fits 15\\" laptops","Brass hardware","Adjustable shoulder strap","Interior organizer pockets"]'
  ]);

  await pool.query(insertProductQuery, [
    'prod-004',
    'Cloud Runner Sneakers',
    'Ultra-lightweight running shoes with responsive cushioning and breathable mesh upper. Engineered for comfort whether you are hitting the track or the streets.',
    159.99, null, '/products/sneakers.png', 'fashion', 4.6, 3201, 1, null,
    '["Ultra-lightweight design","Responsive cushioning","Breathable mesh upper","Non-slip rubber outsole","Reflective details"]'
  ]);

  await pool.query(insertProductQuery, [
    'prod-005',
    'Zenith Aviator Sunglasses',
    'Classic aviator design with polarized lenses and a lightweight titanium frame. UV400 protection meets vintage-inspired luxury in this timeless accessory.',
    219.99, 279.99, '/products/sunglasses.png', 'accessories', 4.5, 1456, 1, 'Trending',
    '["Polarized lenses","Titanium frame","UV400 protection","Anti-reflective coating","Premium leather case included"]'
  ]);

  await pool.query(insertProductQuery, [
    'prod-006',
    'Lumix Pro Mirrorless Camera',
    'Capture stunning photos and 4K video with this professional-grade mirrorless camera. Features a 24.2MP sensor, in-body stabilization, and weather-sealed construction.',
    1299.99, 1499.99, '/products/camera.png', 'electronics', 4.9, 654, 1, 'Pro Choice',
    '["24.2MP Full-Frame sensor","4K 60fps video","5-axis in-body stabilization","Weather-sealed body","Dual card slots"]'
  ]);

  await pool.query(insertProductQuery, [
    'prod-007',
    'Pulse Portable Speaker',
    'Take your music anywhere with this waterproof Bluetooth speaker. Rich 360° sound, 20-hour battery, and a rugged design that is ready for any adventure.',
    79.99, null, '/products/speaker.png', 'electronics', 4.4, 4521, 1, null,
    '["360° immersive sound","20-hour battery life","IP67 waterproof","Built-in microphone","USB-C fast charging"]'
  ]);

  await pool.query(insertProductQuery, [
    'prod-008',
    'Monarch Slim Wallet',
    'Minimalist design meets premium craftsmanship. This slim wallet holds up to 8 cards and features RFID-blocking technology, all wrapped in buttery-soft Nappa leather.',
    69.99, 89.99, '/products/wallet.png', 'accessories', 4.7, 2109, 1, null,
    '["Nappa leather construction","RFID-blocking technology","Holds up to 8 cards","Slim profile design","Gift box included"]'
  ]);

  // Seed demo user
  const passwordHash = bcryptjs.hashSync('demo123', 10);
  await pool.query(
    'INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
    ['user-demo', 'Demo User', 'demo@luxestore.com', passwordHash]
  );
  
  console.log('Database seeded successfully.');
}
export async function initializeDatabase(): Promise<void> {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[YOUR-')) {
      console.warn("DATABASE_URL is not configured or uses placeholders. Skipping database initialization.");
      return;
    }
    
    // Create tables using PostgreSQL dialect
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        original_price REAL,
        image TEXT NOT NULL,
        category TEXT NOT NULL,
        rating REAL NOT NULL DEFAULT 0,
        review_count INTEGER NOT NULL DEFAULT 0,
        in_stock INTEGER NOT NULL DEFAULT 1,
        badge TEXT,
        features TEXT
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        icon TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        UNIQUE(user_id, product_id)
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subtotal REAL NOT NULL,
        shipping REAL NOT NULL,
        tax REAL NOT NULL,
        total REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'processing',
        payment_method TEXT NOT NULL,
        shipping_address TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        estimated_delivery TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        product_image TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL
      );
    `);
    
    await seedDatabase();
  })();
  
  return initPromise;
}

export function getDb(): Pool {
  // Trigger initialization background safety (non-blocking in synchronous getDb context)
  if (process.env.DATABASE_URL) {
    initializeDatabase().catch(err => {
      console.error("Lazy database initialization failed:", err);
    });
  }
  return pool;
}

// Initial default trigger
getDb();

export { pool as db };

/* Server-only database module */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcryptjs from 'bcryptjs';

// Singleton database instance
let dbInstance: InstanceType<typeof Database> | null = null;

function createDatabase(): InstanceType<typeof Database> {
  const dataDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, 'store.db');
  const db = new Database(dbPath);

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subtotal REAL NOT NULL,
      shipping REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'processing',
      payment_method TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      estimated_delivery TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_image TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  return db;
}

function seedDatabase(db: InstanceType<typeof Database>): void {
  // Check if products table already has data
  const row = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (row.count > 0) return;

  const seedTransaction = db.transaction(() => {
    // Seed categories
    const insertCategory = db.prepare(
      'INSERT INTO categories (id, name, slug, icon) VALUES (?, ?, ?, ?)'
    );
    insertCategory.run('cat-1', 'Electronics', 'electronics', '🔌');
    insertCategory.run('cat-2', 'Accessories', 'accessories', '👜');
    insertCategory.run('cat-3', 'Fashion', 'fashion', '👟');

    // Seed products
    const insertProduct = db.prepare(
      `INSERT INTO products (id, name, description, price, original_price, image, category, rating, review_count, in_stock, badge, features)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    insertProduct.run(
      'prod-001',
      'Nova Pro Wireless Headphones',
      'Experience studio-quality sound with active noise cancellation, 40-hour battery life, and ultra-comfortable memory foam ear cushions. Perfect for audiophiles and professionals alike.',
      299.99, 399.99, '/products/headphones.png', 'electronics', 4.8, 2341, 1, 'Best Seller',
      '["Active Noise Cancellation","40-hour battery life","Hi-Res Audio certified","Memory foam ear cushions","Multi-device connectivity"]'
    );

    insertProduct.run(
      'prod-002',
      'Aura Elite Smartwatch',
      'Stay connected and track your health with this premium smartwatch featuring AMOLED display, heart rate monitoring, GPS, and 7-day battery life in a stunning rose gold finish.',
      449.99, 549.99, '/products/smartwatch.png', 'electronics', 4.7, 1876, 1, 'New Arrival',
      '["1.4\\" AMOLED Display","Heart rate & SpO2 monitoring","Built-in GPS","7-day battery life","5ATM water resistance"]'
    );

    insertProduct.run(
      'prod-003',
      'Heritage Leather Messenger Bag',
      'Handcrafted from full-grain Italian leather, this messenger bag combines timeless style with modern functionality. Features padded laptop compartment and multiple organizer pockets.',
      189.99, 249.99, '/products/bag.png', 'accessories', 4.9, 987, 1, 'Premium',
      '["Full-grain Italian leather","Fits 15\\" laptops","Brass hardware","Adjustable shoulder strap","Interior organizer pockets"]'
    );

    insertProduct.run(
      'prod-004',
      'Cloud Runner Sneakers',
      'Ultra-lightweight running shoes with responsive cushioning and breathable mesh upper. Engineered for comfort whether you are hitting the track or the streets.',
      159.99, null, '/products/sneakers.png', 'fashion', 4.6, 3201, 1, null,
      '["Ultra-lightweight design","Responsive cushioning","Breathable mesh upper","Non-slip rubber outsole","Reflective details"]'
    );

    insertProduct.run(
      'prod-005',
      'Zenith Aviator Sunglasses',
      'Classic aviator design with polarized lenses and a lightweight titanium frame. UV400 protection meets vintage-inspired luxury in this timeless accessory.',
      219.99, 279.99, '/products/sunglasses.png', 'accessories', 4.5, 1456, 1, 'Trending',
      '["Polarized lenses","Titanium frame","UV400 protection","Anti-reflective coating","Premium leather case included"]'
    );

    insertProduct.run(
      'prod-006',
      'Lumix Pro Mirrorless Camera',
      'Capture stunning photos and 4K video with this professional-grade mirrorless camera. Features a 24.2MP sensor, in-body stabilization, and weather-sealed construction.',
      1299.99, 1499.99, '/products/camera.png', 'electronics', 4.9, 654, 1, 'Pro Choice',
      '["24.2MP Full-Frame sensor","4K 60fps video","5-axis in-body stabilization","Weather-sealed body","Dual card slots"]'
    );

    insertProduct.run(
      'prod-007',
      'Pulse Portable Speaker',
      'Take your music anywhere with this waterproof Bluetooth speaker. Rich 360° sound, 20-hour battery, and a rugged design that is ready for any adventure.',
      79.99, null, '/products/speaker.png', 'electronics', 4.4, 4521, 1, null,
      '["360° immersive sound","20-hour battery life","IP67 waterproof","Built-in microphone","USB-C fast charging"]'
    );

    insertProduct.run(
      'prod-008',
      'Monarch Slim Wallet',
      'Minimalist design meets premium craftsmanship. This slim wallet holds up to 8 cards and features RFID-blocking technology, all wrapped in buttery-soft Nappa leather.',
      69.99, 89.99, '/products/wallet.png', 'accessories', 4.7, 2109, 1, null,
      '["Nappa leather construction","RFID-blocking technology","Holds up to 8 cards","Slim profile design","Gift box included"]'
    );

    // Seed demo user
    const passwordHash = bcryptjs.hashSync('demo123', 10);
    const insertUser = db.prepare(
      'INSERT OR IGNORE INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)'
    );
    insertUser.run('user-demo', 'Demo User', 'demo@luxestore.com', passwordHash);
  });

  seedTransaction();
  console.log('Database seeded successfully.');
}

/**
 * Returns the singleton database instance, creating and seeding it on first call.
 */
export function getDb(): InstanceType<typeof Database> {
  if (!dbInstance) {
    dbInstance = createDatabase();
    seedDatabase(dbInstance);
  }
  return dbInstance;
}

// Initialize database on module load
const db = getDb();

export { db };

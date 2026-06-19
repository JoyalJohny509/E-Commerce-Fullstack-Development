import { pool } from './index';
import { seedDatabase } from './seed';

let initPromise: Promise<void> | null = null;

/**
 * Initialize the database: create tables if they don't exist and seed data.
 * This is idempotent and safe to call multiple times — uses a singleton promise.
 *
 * Note: We still use raw SQL for CREATE TABLE IF NOT EXISTS because Drizzle's
 * push/migrate commands are CLI tools, not runtime operations. This is the
 * standard pattern — schema creation happens via raw DDL, all subsequent
 * queries use the Drizzle ORM.
 */
export async function initializeDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[YOUR-')) {
      console.warn('DATABASE_URL is not configured or uses placeholders. Skipping database initialization.');
      return;
    }

    // Create tables using PostgreSQL dialect (idempotent DDL)
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
        status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT NOT NULL,
        shipping_address TEXT NOT NULL,
        stripe_session_id TEXT,
        stripe_payment_intent_id TEXT,
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

    // Migration: Add Stripe columns to existing orders table (idempotent)
    await pool.query(`
      DO $$
      BEGIN
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
      EXCEPTION WHEN others THEN
        -- Columns may already exist
        NULL;
      END $$;
    `);

    // Migration: Enable pgvector and add embedding column to products table (idempotent)
    try {
      await pool.query(`
        CREATE EXTENSION IF NOT EXISTS vector;
      `);
      await pool.query(`
        DO $$
        BEGIN
          ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding vector(1536);
        EXCEPTION WHEN others THEN
          NULL;
        END $$;
      `);
    } catch (err) {
      console.warn('Could not initialize pgvector extension or add embedding column:', err);
    }

    await seedDatabase();
  })();

  return initPromise;
}

// Trigger initialization on module import (lazy, non-blocking)
if (process.env.DATABASE_URL) {
  initializeDatabase().catch((err) => {
    console.error('Lazy database initialization failed:', err);
  });
}

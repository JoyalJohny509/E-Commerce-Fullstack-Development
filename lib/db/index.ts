import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Global cache for connection pool to avoid duplicates in dev (HMR)
const globalForPool = global as typeof globalThis & {
  pgPool?: Pool;
};

function getPool(): Pool {
  if (process.env.NODE_ENV === 'production') {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }

  if (!globalForPool.pgPool) {
    globalForPool.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return globalForPool.pgPool;
}

const pool = getPool();

/**
 * Drizzle ORM instance wrapping the PostgreSQL connection pool.
 * Use this for all database queries — it provides full type safety
 * and SQL injection prevention via parameterized queries.
 */
export const db = drizzle(pool, { schema });

/**
 * Raw pool export — only use for transactions that need client.query('BEGIN')
 * or other low-level operations not yet supported by Drizzle's API.
 */
export { pool };

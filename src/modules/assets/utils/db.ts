/**
 * Asset Module Database Connection
 *
 * Provides database connection for the asset module.
 * This module is self-contained and uses its own connection.
 */

import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let sql: NeonQueryFunction<false, false> | null = null;

/**
 * Get database connection
 * Lazily initializes the connection on first use
 */
export function getDbConnection(): NeonQueryFunction<false, false> {
  if (sql) {
    return sql;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  sql = neon(databaseUrl);
  return sql;
}

/**
 * Validate database connection
 */
export async function validateConnection(): Promise<boolean> {
  try {
    const db = getDbConnection();
    await db`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Asset module database connection failed:', error);
    return false;
  }
}

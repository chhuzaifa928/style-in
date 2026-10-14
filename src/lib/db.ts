import mysql, { Pool, PoolOptions } from 'mysql2/promise';

/**
 * MySQL connection pool singleton.
 *
 * Next.js in dev re-evaluates modules on hot reload, which would otherwise
 * open a new pool on every change and exhaust Hostinger's connection limit.
 * We cache the pool on `globalThis` to guarantee a single pool per process.
 *
 * All queries throughout the app use `pool.execute(sql, params)` with
 * parameterized placeholders (`?`) — never string concatenation — so the
 * driver sends values separately from the SQL text (SQL-injection safe).
 */

declare global {
  // eslint-disable-next-line no-var
  var __stylein_pool: Pool | undefined;
}

function createPool(): Pool {
  const options: PoolOptions = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // max: 10
    maxIdle: 10,
    idleTimeout: 30000, // idleTimeout: 30000 ms
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    charset: 'utf8mb4_unicode_ci',
    // Return DECIMAL/BIGINT columns as JS numbers where safe, keep JSON parsed.
    decimalNumbers: true,
    namedPlaceholders: false,
    multipleStatements: false, // defense-in-depth against stacked queries
  };

  return mysql.createPool(options);
}

export const pool: Pool =
  global.__stylein_pool ?? (global.__stylein_pool = createPool());

/**
 * Thin typed helper around pool.execute for SELECT queries.
 * Always pass params as the second argument; never interpolate into `sql`.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: ReadonlyArray<unknown> = [],
): Promise<T[]> {
  const [rows] = await pool.execute(sql, params as unknown[]);
  return rows as T[];
}

/**
 * Helper for INSERT/UPDATE/DELETE. Returns the raw ResultSetHeader.
 */
export async function execute(
  sql: string,
  params: ReadonlyArray<unknown> = [],
): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.execute(sql, params as unknown[]);
  return result as mysql.ResultSetHeader;
}

/**
 * Run a set of statements inside a single transaction with a dedicated
 * connection (used for order placement + stock decrement atomicity).
 */
export async function withTransaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* ignore rollback failure */
    }
    throw err;
  } finally {
    conn.release();
  }
}

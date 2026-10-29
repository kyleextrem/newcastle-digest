import 'server-only';

import { attachDatabasePool } from '@vercel/functions';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

/**
 * Server-only shop database access.
 * The pool is created on the first query so a production build does not
 * open a connection. Use the pooled Neon URL only.
 */

const POOL_MAX = 2;
const IDLE_TIMEOUT_MS = 5_000;
const CONNECTION_TIMEOUT_MS = 5_000;
const MAX_LIFETIME_SECONDS = 60;
const IDLE_IN_TRANSACTION_TIMEOUT_MS = 15_000;

let pool: Pool | null = null;

function pooledConnectionString(connectionString: string): string {
  // pg currently treats require, prefer, and verify-ca as verify-full, then warns.
  // Keep that verification and pass the mode pg will not warn about.
  return connectionString.replace(
    /([?&]sslmode=)(prefer|require|verify-ca)\b/gi,
    '$1verify-full',
  );
}

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    throw new Error('Database is not configured');
  }

  const next = new Pool({
    connectionString: pooledConnectionString(connectionString),
    max: POOL_MAX,
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    maxLifetimeSeconds: MAX_LIFETIME_SECONDS,
    allowExitOnIdle: true,
    idle_in_transaction_session_timeout: IDLE_IN_TRANSACTION_TIMEOUT_MS,
    application_name: 'newcastle-digest-shop',
  });

  next.on('error', () => {
    console.error('Database pool client failed');
  });

  attachDatabasePool(next);
  pool = next;
  return next;
}

export type QueryParams = readonly unknown[];

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: QueryParams = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, [...values]);
}

export type Sql = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: QueryParams,
) => Promise<QueryResult<T>>;

export async function transaction<T>(run: (sql: Sql) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  const sql: Sql = (text, values = []) => client.query(text, [...values]);

  try {
    await client.query('BEGIN');
    const result = await run(sql);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await transaction(async (sql) => {
      await sql('SET TRANSACTION READ ONLY');
      return sql<{ ok: number }>('SELECT 1 AS ok');
    });
    const value: unknown = result.rows[0]?.ok;
    return value === 1 || value === '1';
  } catch {
    console.error('Database health check failed');
    return false;
  }
}

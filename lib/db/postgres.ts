// ---------------------------------------------------------------------------
// PostgreSQL client singleton — connects to the db_gold database
// Mirrors the connector in cicero_mcp/src/db/postgres.ts so both apps share
// the same env var contract and connection pattern. Keep diff-clean with
// that file when updating.
// ---------------------------------------------------------------------------

import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

export function getPool(): pg.Pool {
  if (!pool) {
    const server = process.env.POSTGRES_SERVER
    const user = process.env.POSTGRES_USER
    const password = process.env.POSTGRES_PASSWORD
    const port = process.env.POSTGRES_PORT || '5432'
    const database =
      process.env.POSTGRES_DATABASE_GOLD || process.env.POSTGRES_DATABASE || 'db_gold'

    if (!server || !user || !password) {
      throw new Error(
        'PostgreSQL credentials missing. Required: POSTGRES_SERVER, POSTGRES_USER, POSTGRES_PASSWORD',
      )
    }

    const encodedPassword = encodeURIComponent(password)
    const connectionString = `postgresql://${user}:${encodedPassword}@${server}:${port}/${database}?sslmode=require`

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
    })

    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err.message)
    })
  }

  return pool
}

export async function query(text: string, params?: unknown[]): Promise<pg.QueryResult> {
  const client = await getPool().connect()
  try {
    return await client.query(text, params)
  } finally {
    client.release()
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

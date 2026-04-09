// ---------------------------------------------------------------------------
// POST /api/benchmark/salary
// Aggregates placement_salary from public.bh_placements (Postgres / db_gold)
// to compute a 25th–75th percentile range for comparable placements in the
// last 2 years. Optionally filters by roleTitle (ILIKE on job_title_placement).
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'

interface BenchmarkRequest {
  roleTitle?: string
}

interface BenchmarkResponse {
  p25: number | null
  p50: number | null
  p75: number | null
  avg: number | null
  n: number
  roleTitleUsed: string
  periodLabel: string
}

const SQL = `
  SELECT
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY placement_salary) AS p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY placement_salary) AS p50,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY placement_salary) AS p75,
    AVG(placement_salary)::numeric AS avg,
    COUNT(*)::int AS n
  FROM public.bh_placements
  WHERE placement_salary IS NOT NULL
    AND placement_salary > 0
    AND start_date >= NOW() - INTERVAL '2 years'
    AND ($1::text IS NULL OR job_title_placement ILIKE '%' || $1 || '%')
`

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export async function POST(request: Request) {
  if (
    !process.env.POSTGRES_SERVER ||
    !process.env.POSTGRES_USER ||
    !process.env.POSTGRES_PASSWORD
  ) {
    return NextResponse.json(
      { error: 'Salary benchmark not configured' },
      { status: 501 },
    )
  }

  let body: BenchmarkRequest = {}
  try {
    body = (await request.json()) as BenchmarkRequest
  } catch {
    // Empty or invalid JSON — treat as no filter
  }

  const roleTitle = typeof body.roleTitle === 'string' ? body.roleTitle.trim() : ''
  const filter = roleTitle.length > 0 ? roleTitle : null

  try {
    const result = await query(SQL, [filter])
    const row = result.rows[0] ?? {}

    const response: BenchmarkResponse = {
      p25: toNumberOrNull(row.p25),
      p50: toNumberOrNull(row.p50),
      p75: toNumberOrNull(row.p75),
      avg: toNumberOrNull(row.avg),
      n: typeof row.n === 'number' ? row.n : 0,
      roleTitleUsed: roleTitle,
      periodLabel: 'last 2 years',
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('Salary benchmark query failed:', err)
    return NextResponse.json(
      { error: 'Failed to query benchmark' },
      { status: 500 },
    )
  }
}

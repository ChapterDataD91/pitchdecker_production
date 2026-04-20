// Bounded-parallelism helpers for AI fan-out (CV parse, candidate scoring).
// `mapLimit` runs at most `limit` promises in flight at once; `fetchWithRetry`
// backs off on 429 so a burst that clips Anthropic's output-TPM ceiling
// self-throttles rather than surfacing as per-item errors.

export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0
  const workerCount = Math.max(1, Math.min(limit, items.length))

  async function worker() {
    while (true) {
      const idx = cursor++
      if (idx >= items.length) return
      results[idx] = await fn(items[idx], idx)
    }
  }

  await Promise.all(Array.from({ length: workerCount }, worker))
  return results
}

const MAX_RETRY_ATTEMPTS = 4

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    const res = await fetch(input, init)
    if (res.status !== 429 || attempt === MAX_RETRY_ATTEMPTS) return res

    const retryAfterHeader = res.headers.get('retry-after')
    const retryAfterSec = retryAfterHeader
      ? Number(retryAfterHeader)
      : 2 ** attempt
    const delayMs = (Number.isFinite(retryAfterSec) ? retryAfterSec : 2 ** attempt) * 1000
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  // unreachable — the loop either returns or retries
  throw new Error('fetchWithRetry: exhausted retries')
}

import { getToken } from '@/auth/token'
import type { ApiError } from './types'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export class HttpError extends Error {
  status: number
  detail: string
  constructor(status: number, detail: string) {
    super(`HTTP ${status}: ${detail}`)
    this.name = 'HttpError'
    this.status = status
    this.detail = detail
  }
}

export interface RequestOptions {
  method?: string
  /** JSON body — ignored when `formData` is provided. */
  body?: unknown
  formData?: FormData
  /** Whether to attach the Bearer token. Auth endpoints set this false. */
  auth?: boolean
  /** Retries on network errors / 5xx with exponential backoff. */
  retries?: number
  signal?: AbortSignal
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** A status worth retrying: transient server / gateway problems. */
function isRetriableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504 || status === 429
}

async function parseDetail(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiError
    return data?.detail ?? res.statusText
  } catch {
    return res.statusText
  }
}

export async function request<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    formData,
    auth = true,
    retries = 3,
    signal,
  } = opts

  const headers: Record<string, string> = {}
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  if (!formData && body !== undefined) headers['Content-Type'] = 'application/json'

  const url = `${BASE}${path}`
  let attempt = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
        signal,
      })

      if (!res.ok) {
        if (isRetriableStatus(res.status) && attempt < retries) {
          attempt += 1
          await sleep(2 ** attempt * 250)
          continue
        }
        throw new HttpError(res.status, await parseDetail(res))
      }

      if (res.status === 204 || res.status === 202) return undefined as T
      const text = await res.text()
      return (text ? JSON.parse(text) : undefined) as T
    } catch (err) {
      // Abort is intentional — never retry it.
      if (signal?.aborted) throw err
      // HttpError from a non-retriable status: surface immediately.
      if (err instanceof HttpError) throw err
      // Network-level failure (fetch threw): retry with backoff.
      if (attempt < retries) {
        attempt += 1
        await sleep(2 ** attempt * 250)
        continue
      }
      throw err
    }
  }
}

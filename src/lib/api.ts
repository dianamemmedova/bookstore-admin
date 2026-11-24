// Backend ilə danışan yeganə yer: token avtomatik əlavə olunur, xətalar vahid formaya düşür.
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

const TOKEN_KEY = 'bookstore_admin_token'

export const tokenStore = {
  get(): string | null {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  set(token: string) {
    try { localStorage.setItem(TOKEN_KEY, token) } catch { /* private mode */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY) } catch { /* private mode */ }
  },
}

// Backend-in xəta formatı: { error: { code, message, requestId, details? } }
export class ApiError extends Error {
  status: number
  code: string
  details?: { field: string | null; message: string }[]

  constructor(status: number, code: string, message: string, details?: ApiError['details']) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  // Forma xətaları üçün: { price: 'price 0-dan böyük olmalıdır', ... }
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {}
    for (const d of this.details ?? []) if (d.field && !out[d.field]) out[d.field] = d.message
    return out
  }
}

// Token vaxtı bitəndə AuthContext bunu eşidib istifadəçini çıxarır
export const AUTH_EXPIRED_EVENT = 'admin:auth-expired'

type Query = Record<string, string | number | boolean | undefined | null>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  formData?: FormData // fayl yükləmə üçün (Content-Type brauzer özü qoyur)
  query?: Query
  auth?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(API_URL + path)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, query, auth = true, signal } = options
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (auth && token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal,
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiError(0, 'NETWORK_ERROR', 'Serverlə əlaqə yoxdur. Backend-in işlədiyinə baxın.')
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { /* JSON deyil */ }

  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string; details?: ApiError['details'] } } | null)?.error
    if (res.status === 401 && auth && token) {
      tokenStore.clear()
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    throw new ApiError(res.status, err?.code ?? 'UNKNOWN', err?.message ?? `Xəta baş verdi (${res.status})`, err?.details)
  }

  return data as T
}
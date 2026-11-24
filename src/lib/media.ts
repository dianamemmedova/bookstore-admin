import { API_URL } from './api'

export function coverSrc(url: string | null | undefined): string | null {
  if (!url) return null
  return url.startsWith('/') ? `${API_URL}${url}` : url
}
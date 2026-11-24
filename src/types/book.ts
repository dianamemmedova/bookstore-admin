// Admin siyahısından gələn kitab (GET /admin/books)
export interface AdminBook {
  id: number
  externalId: string | null
  title: string
  author: string
  description: string | null
  coverUrl: string | null
  year: number | null
  pages: number | null
  subjects: string[]
  priceCents: number
  price: number
  inStock: boolean
  stock: number | null // null = limitsiz
  createdAt: string
  updatedAt: string
}

export interface Paged<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type StockStatus = 'in' | 'low' | 'out' | 'unlimited'
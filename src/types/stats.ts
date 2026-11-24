export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED'

export interface Overview {
  orders: { total: number; byStatus: Record<OrderStatus, number> }
  revenue: { grossCents: number; deliveredCents: number }
  users: { total: number; newLast30Days: number }
  books: { total: number; outOfStock: number; lowStock: number; lowStockLimit: number }
  reviews: { total: number; avgRating: number }
  inbox: { unreadContactMessages: number; activeSubscribers: number }
}

export interface SalesDay { date: string; orders: number; revenueCents: number }
export interface Sales { days: number; totalOrders: number; totalRevenueCents: number; series: SalesDay[] }

export interface TopBook {
  bookId: number
  title: string
  author: string
  coverUrl: string | null
  quantitySold: number
  revenueCents: number
}

export interface LowStockBook {
  id: number
  title: string
  author: string
  coverUrl: string | null
  stock: number
}
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED'

export interface OrderItem {
  bookId: number
  title: string
  author: string
  coverUrl: string | null
  unitPriceCents: number
  unitPrice: number
  quantity: number
  lineTotalCents: number
}

// GET /admin/orders və PATCH /admin/orders/:id/status eyni formada qaytarır
export interface AdminOrder {
  id: number
  status: OrderStatus
  payMethod: 'CARD' | 'CASH'
  items: OrderItem[]
  subtotalCents: number
  discountCents: number
  deliveryFeeCents: number
  totalCents: number
  promoCode: string | null
  discountPercent: number | null
  deliveryDate: string
  delivery: {
    fullName: string
    phone: string
    city: string
    street: string
    building: string | null
    apartment: string | null
  }
  createdAt: string
  cancelledAt: string | null
  user: { id: number; email: string; firstName: string; lastName: string }
}
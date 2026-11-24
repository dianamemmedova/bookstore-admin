export interface Subscriber {
  id: number
  email: string
  isActive: boolean
  subscribedAt: string
  unsubscribedAt: string | null
}

export interface SubscriberList {
  items: Subscriber[]
  activeCount: number
  page: number
  limit: number
  total: number
  totalPages: number
}
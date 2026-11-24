export interface ContactMessage {
  id: number
  userId: number | null
  name: string
  email: string
  subject: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface MessageList {
  items: ContactMessage[]
  unreadCount: number
  page: number
  limit: number
  total: number
  totalPages: number
}
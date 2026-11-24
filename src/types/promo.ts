export interface AdminPromo {
  id: number
  code: string
  description: string | null
  discountPercent: number
  isActive: boolean
  expiresAt: string | null // null = müddətsiz
  usedCount: number
  createdAt: string
}
export interface AdminGiftCard {
  id: number
  code: string // 16 rəqəm
  initialCents: number
  initial: number
  balanceCents: number
  balance: number
  isActive: boolean
  expiresAt: string | null
  note: string | null
  createdAt: string
}
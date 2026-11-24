import Badge from '../ui/Badge'
import type { BadgeTone } from '../ui/Badge'
import type { OrderStatus } from '../../types/order'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Gözləyir',
  CONFIRMED: 'Təsdiqlənib',
  DELIVERED: 'Çatdırılıb',
  CANCELLED: 'Ləğv edilib',
}

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
}

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
}
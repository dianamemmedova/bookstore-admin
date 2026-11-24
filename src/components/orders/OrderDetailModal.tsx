import { useState } from 'react'
import { CheckCircle2, PackageCheck, XCircle } from 'lucide-react'
import Modal, { ConfirmDialog } from '../ui/Modal'
import Button from '../ui/Button'
import BookCover from '../ui/BookCover'
import OrderStatusBadge from './OrderStatusBadge'
import { ApiError, api } from '../../lib/api'
import { formatDate, formatDateTime, formatMoney } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import type { AdminOrder, OrderStatus } from '../../types/order'

interface Props {
  order: AdminOrder | null
  onClose: () => void
  onChanged: (order: AdminOrder) => void
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 text-sm ${strong ? 'font-semibold text-ink' : 'text-muted'}`}>
      <span>{label}</span>
      <span className={strong ? '' : 'text-ink'}>{value}</span>
    </div>
  )
}

export default function OrderDetailModal({ order, onClose, onChanged }: Props) {
  const toast = useToast()
  const [busy, setBusy] = useState<OrderStatus | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const change = async (status: Exclude<OrderStatus, 'PENDING'>) => {
    if (!order) return
    setBusy(status)
    try {
      const updated = await api<AdminOrder>(`/admin/orders/${order.id}/status`, { method: 'PATCH', body: { status } })
      toast.success(status === 'CANCELLED' ? 'Sifariş ləğv edildi, stok qaytarıldı' : 'Status yeniləndi')
      onChanged(updated)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Status dəyişmədi')
    } finally {
      setBusy(null)
      setConfirmCancel(false)
    }
  }

  const canConfirm = order?.status === 'PENDING'
  const canDeliver = order?.status === 'CONFIRMED'
  const canCancel = order?.status === 'PENDING' || order?.status === 'CONFIRMED'
  const d = order?.delivery

  return (
    <>
      <Modal
        open={order !== null}
        onClose={onClose}
        title={order ? `Sifariş #${order.id}` : ''}
        size="lg"
        footer={
          order && (
            <>
              {canCancel && (
                <Button variant="danger" className="mr-auto" icon={<XCircle size={16} />} onClick={() => setConfirmCancel(true)} disabled={busy !== null}>
                  Ləğv et
                </Button>
              )}
              <Button variant="secondary" onClick={onClose}>Bağla</Button>
              {canConfirm && (
                <Button icon={<CheckCircle2 size={16} />} loading={busy === 'CONFIRMED'} onClick={() => change('CONFIRMED')}>Təsdiqlə</Button>
              )}
              {canDeliver && (
                <Button icon={<PackageCheck size={16} />} loading={busy === 'DELIVERED'} onClick={() => change('DELIVERED')}>Çatdırıldı</Button>
              )}
            </>
          )
        }
      >
        {order && d && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <OrderStatusBadge status={order.status} />
              <span className="text-sm text-muted">{formatDateTime(order.createdAt)}</span>
              <span className="text-sm text-muted">· {order.payMethod === 'CARD' ? 'Kartla' : 'Qapıda nağd'}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-line p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Müştəri</p>
                <p className="text-sm font-medium text-ink">{order.user.firstName} {order.user.lastName}</p>
                <p className="text-sm text-muted">{order.user.email}</p>
              </div>
              <div className="rounded-lg border border-line p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Çatdırılma</p>
                <p className="text-sm font-medium text-ink">{d.fullName} · {d.phone}</p>
                <p className="text-sm text-muted">
                  {d.city}, {d.street}{d.building ? `, bina ${d.building}` : ''}{d.apartment ? `, mən. ${d.apartment}` : ''}
                </p>
                <p className="mt-1 text-xs text-muted">Tarix: {formatDate(order.deliveryDate)}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Məhsullar</p>
              <ul className="divide-y divide-line rounded-lg border border-line">
                {order.items.map((it) => (
                  <li key={it.bookId} className="flex items-center gap-3 p-3">
                    <BookCover url={it.coverUrl} title={it.title} className="h-14 w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{it.title}</p>
                      <p className="truncate text-xs text-muted">{it.author}</p>
                    </div>
                    <p className="text-xs text-muted whitespace-nowrap">{formatMoney(it.unitPriceCents)} × {it.quantity}</p>
                    <p className="w-20 text-right text-sm font-medium text-ink">{formatMoney(it.lineTotalCents)}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5 rounded-lg bg-surface-2 p-4">
              <Row label="Ara cəm" value={formatMoney(order.subtotalCents)} />
              {order.discountCents > 0 && (
                <Row label={`Endirim${order.promoCode ? ` (${order.promoCode}${order.discountPercent ? ` −${order.discountPercent}%` : ''})` : ''}`} value={`−${formatMoney(order.discountCents)}`} />
              )}
              <Row label="Çatdırılma" value={order.deliveryFeeCents === 0 ? 'Pulsuz' : formatMoney(order.deliveryFeeCents)} />
              <div className="border-t border-line pt-2"><Row label="Yekun" value={formatMoney(order.totalCents)} strong /></div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmCancel}
        title="Sifarişi ləğv et"
        message="Sifariş ləğv olunacaq, kitabların stoku geri qaytarılacaq və promo kod azad olacaq. Davam edək?"
        confirmText="Bəli, ləğv et"
        danger
        loading={busy === 'CANCELLED'}
        onConfirm={() => change('CANCELLED')}
        onClose={() => setConfirmCancel(false)}
      />
    </>
  )
}
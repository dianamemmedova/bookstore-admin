import { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import OrderStatusBadge from '../components/orders/OrderStatusBadge'
import OrderDetailModal from '../components/orders/OrderDetailModal'
import { ApiError, api } from '../lib/api'
import { formatDateTime, formatMoney } from '../lib/format'
import type { Paged } from '../types/book'
import type { AdminOrder, OrderStatus } from '../types/order'

const LIMIT = 10

const TABS: { value: '' | OrderStatus; label: string }[] = [
  { value: '', label: 'Hamısı' },
  { value: 'PENDING', label: 'Gözləyir' },
  { value: 'CONFIRMED', label: 'Təsdiqlənib' },
  { value: 'DELIVERED', label: 'Çatdırılıb' },
  { value: 'CANCELLED', label: 'Ləğv edilib' },
]

export default function OrdersPage() {
  const [data, setData] = useState<Paged<AdminOrder> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'' | OrderStatus>('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [selected, setSelected] = useState<AdminOrder | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    api<{ items: AdminOrder[]; page: number; limit: number; total: number; totalPages: number }>('/admin/orders', {
      query: { status, page, limit: LIMIT },
      signal: controller.signal,
    })
      .then((res) => { setData({ ...res }); setError('') })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setError(err instanceof ApiError ? err.message : 'Siyahı yüklənmədi')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [status, page, reloadKey])

  const changeTab = (value: '' | OrderStatus) => { setStatus(value); setPage(1) }

  // Status dəyişəndə siyahı və açıq pəncərə yenilənir
  const handleChanged = (updated: AdminOrder) => {
    setSelected(updated)
    setReloadKey((k) => k + 1)
  }

  return (
    <>
      <PageHeader title="Sifarişlər" description="Sifarişləri izləyin, təsdiqləyin və çatdırılma statusunu dəyişin." />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => changeTab(t.value)}
            className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
              status === t.value ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-surface-2 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="secondary" className="mt-3" onClick={() => setReloadKey((k) => k + 1)}>Yenidən cəhd et</Button>
          </div>
        ) : !data ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={<ShoppingBag size={22} />} title="Sifariş tapılmadı" description={status ? 'Bu statusda sifariş yoxdur.' : 'Hələ sifariş verilməyib.'} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">№</th>
                  <th className="px-3 py-3">Müştəri</th>
                  <th className="px-3 py-3">Tarix</th>
                  <th className="px-3 py-3">Məhsul</th>
                  <th className="px-3 py-3">Məbləğ</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => (
                  <tr key={o.id} onClick={() => setSelected(o)} className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-2/60">
                    <td className="px-5 py-3 font-medium text-ink">#{o.id}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-ink">{o.user.firstName} {o.user.lastName}</p>
                      <p className="text-xs text-muted">{o.user.email}</p>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted">{formatDateTime(o.createdAt)}</td>
                    <td className="px-3 py-3 text-muted">{o.items.reduce((s, i) => s + i.quantity, 0)} ədəd</td>
                    <td className="px-3 py-3 font-medium text-ink whitespace-nowrap">{formatMoney(o.totalCents)}</td>
                    <td className="px-5 py-3"><OrderStatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.items.length > 0 && (
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onChange={setPage} />
        )}
      </Card>

      <OrderDetailModal order={selected} onClose={() => setSelected(null)} onChanged={handleChanged} />
    </>
  )
}
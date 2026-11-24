import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Gift, Pencil, Plus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import GiftCardForm from '../components/giftcards/GiftCardForm'
import { ApiError, api } from '../lib/api'
import { formatDate, formatMoney } from '../lib/format'
import type { Paged } from '../types/book'
import type { AdminGiftCard } from '../types/giftCard'

const LIMIT = 10

// 4521000012345678 → 4521 0000 1234 5678
const formatCode = (code: string) => code.replace(/(\d{4})(?=\d)/g, '$1 ')

function StatusBadge({ card }: { card: AdminGiftCard }) {
  if (!card.isActive) return <Badge>Deaktiv</Badge>
  if (card.expiresAt && new Date(card.expiresAt) < new Date()) return <Badge tone="danger">Vaxtı bitib</Badge>
  if (card.balanceCents === 0) return <Badge tone="warning">İstifadə olunub</Badge>
  return <Badge tone="success">Aktiv</Badge>
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500) } catch { /* icazə yoxdur */ }
  }
  return (
    <Button variant="ghost" size="sm" onClick={copy} aria-label="Kopyala">{done ? <Check size={15} className="text-success" /> : <Copy size={15} />}</Button>
  )
}

export default function GiftCardsPage() {
  const [data, setData] = useState<Paged<AdminGiftCard> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminGiftCard | null>(null)
  const [created, setCreated] = useState<AdminGiftCard | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    api<Paged<AdminGiftCard>>('/admin/gift-cards', { query: { page, limit: LIMIT }, signal: controller.signal })
      .then((res) => { setData(res); setError('') })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setError(err instanceof ApiError ? err.message : 'Siyahı yüklənmədi')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [page, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])
  const openCreate = () => { setEditing(null); setFormOpen(true) }

  return (
    <>
      <PageHeader
        title="Hədiyyə kartları"
        description="Kart yaradın, balansa baxın və lazım olanda deaktiv edin."
        actions={<Button icon={<Plus size={16} />} onClick={openCreate}>Yeni kart</Button>}
      />

      <Card className="overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="secondary" className="mt-3" onClick={reload}>Yenidən cəhd et</Button>
          </div>
        ) : !data ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={<Gift size={22} />} title="Hədiyyə kartı yoxdur" description="İlk kartı yaradın."
            action={<Button icon={<Plus size={16} />} onClick={openCreate}>Yeni kart</Button>} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Kart nömrəsi</th>
                  <th className="px-3 py-3">Məbləğ</th>
                  <th className="px-3 py-3">Qalıq</th>
                  <th className="px-3 py-3">Bitmə tarixi</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                    <td className="px-5 py-3">
                      <p className="font-mono text-sm font-semibold text-ink">{formatCode(c.code)}</p>
                      {c.note && <p className="max-w-[220px] truncate text-xs text-muted">{c.note}</p>}
                    </td>
                    <td className="px-3 py-3 text-muted">{formatMoney(c.initialCents)}</td>
                    <td className="px-3 py-3 font-medium text-ink">{formatMoney(c.balanceCents)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted">{c.expiresAt ? formatDate(c.expiresAt) : 'Müddətsiz'}</td>
                    <td className="px-3 py-3"><StatusBadge card={c} /></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <CopyButton text={c.code} />
                        <Button variant="ghost" size="sm" aria-label="Redaktə" onClick={() => { setEditing(c); setFormOpen(true) }}><Pencil size={15} /></Button>
                      </div>
                    </td>
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

      <GiftCardForm
        open={formOpen}
        card={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(c) => { setFormOpen(false); if (c) setCreated(c); reload() }}
      />

      <Modal open={created !== null} onClose={() => setCreated(null)} title="Kart yaradıldı" size="sm"
        footer={<Button onClick={() => setCreated(null)}>Bağla</Button>}>
        {created && (
          <div className="text-center">
            <p className="text-sm text-muted">Kart nömrəsi</p>
            <p className="mt-1 font-mono text-xl font-semibold tracking-wide text-ink">{formatCode(created.code)}</p>
            <p className="mt-2 text-sm text-muted">Məbləğ: <span className="font-medium text-ink">{formatMoney(created.initialCents)}</span></p>
            <div className="mt-3 flex justify-center"><CopyButton text={created.code} /></div>
          </div>
        )}
      </Modal>
    </>
  )
}
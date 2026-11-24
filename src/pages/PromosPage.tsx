import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { ConfirmDialog } from '../components/ui/Modal'
import PromoForm from '../components/promos/PromoForm'
import { ApiError, api } from '../lib/api'
import { formatDate } from '../lib/format'
import { useToast } from '../context/ToastContext'
import type { Paged } from '../types/book'
import type { AdminPromo } from '../types/promo'

const LIMIT = 10

function StatusBadge({ promo }: { promo: AdminPromo }) {
  if (!promo.isActive) return <Badge>Deaktiv</Badge>
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return <Badge tone="danger">Vaxtı bitib</Badge>
  return <Badge tone="success">Aktiv</Badge>
}

export default function PromosPage() {
  const toast = useToast()
  const [data, setData] = useState<Paged<AdminPromo> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminPromo | null>(null)
  const [deleting, setDeleting] = useState<AdminPromo | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    api<Paged<AdminPromo>>('/admin/promos', { query: { page, limit: LIMIT }, signal: controller.signal })
      .then((res) => { setData(res); setError('') })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setError(err instanceof ApiError ? err.message : 'Siyahı yüklənmədi')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [page, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  const toggleActive = async (p: AdminPromo) => {
    try {
      await api(`/admin/promos/${p.id}`, { method: 'PATCH', body: { isActive: !p.isActive } })
      toast.success(p.isActive ? 'Kod deaktiv edildi' : 'Kod aktiv edildi')
      reload()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Dəyişmədi')
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api(`/admin/promos/${deleting.id}`, { method: 'DELETE' })
      toast.success('Promo kod silindi')
      setDeleting(null)
      if (data && data.items.length === 1 && page > 1) setPage(page - 1)
      else reload()
    } catch (err) {
      toast.error(err instanceof ApiError && err.code === 'PROMO_IN_USE'
        ? 'Bu kod istifadə olunub, silmək olmaz. Əvəzinə deaktiv edin.'
        : err instanceof ApiError ? err.message : 'Silinmədi')
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  const openCreate = () => { setEditing(null); setFormOpen(true) }

  return (
    <>
      <PageHeader
        title="Promo kodlar"
        description="Endirim kodlarını yaradın, deaktiv edin və istifadəyə nəzarət edin."
        actions={<Button icon={<Plus size={16} />} onClick={openCreate}>Yeni kod</Button>}
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
          <EmptyState icon={<Tag size={22} />} title="Promo kod yoxdur" description="İlk endirim kodunu yaradın."
            action={<Button icon={<Plus size={16} />} onClick={openCreate}>Yeni kod</Button>} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Kod</th>
                  <th className="px-3 py-3">Endirim</th>
                  <th className="px-3 py-3">İstifadə</th>
                  <th className="px-3 py-3">Bitmə tarixi</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                    <td className="px-5 py-3">
                      <p className="font-mono text-sm font-semibold text-ink">{p.code}</p>
                      {p.description && <p className="max-w-[240px] truncate text-xs text-muted">{p.description}</p>}
                    </td>
                    <td className="px-3 py-3 font-medium text-ink">−{p.discountPercent}%</td>
                    <td className="px-3 py-3 text-muted">{p.usedCount} dəfə</td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted">{p.expiresAt ? formatDate(p.expiresAt) : 'Müddətsiz'}</td>
                    <td className="px-3 py-3"><StatusBadge promo={p} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(p)}>{p.isActive ? 'Deaktiv et' : 'Aktiv et'}</Button>
                        <Button variant="ghost" size="sm" aria-label="Redaktə" onClick={() => { setEditing(p); setFormOpen(true) }}><Pencil size={15} /></Button>
                        <Button variant="ghost" size="sm" aria-label="Sil" className="hover:!text-danger" onClick={() => setDeleting(p)}><Trash2 size={15} /></Button>
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

      <PromoForm open={formOpen} promo={editing} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); reload() }} />

      <ConfirmDialog
        open={deleting !== null}
        title="Promo kodu sil"
        message={deleting ? `“${deleting.code}” kodu silinəcək. Davam edək?` : ''}
        confirmText="Sil"
        danger
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { ConfirmDialog } from '../components/ui/Modal'
import EventForm from '../components/events/EventForm'
import { ApiError, api } from '../lib/api'
import { formatDate } from '../lib/format'
import { useToast } from '../context/ToastContext'
import { EVENT_LOCATION_LABEL, EVENT_TYPE_LABEL } from '../types/store'
import type { Paged } from '../types/book'
import type { AdminStore, StoreEvent } from '../types/store'

const LIMIT = 10

const TYPE_FILTER = [{ value: '', label: 'Bütün növlər' }, ...Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => ({ value, label }))]

export default function EventsPage() {
  const toast = useToast()
  const [data, setData] = useState<Paged<StoreEvent> | null>(null)
  const [stores, setStores] = useState<AdminStore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [type, setType] = useState('')
  const [storeId, setStoreId] = useState('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StoreEvent | null>(null)
  const [deleting, setDeleting] = useState<StoreEvent | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    api<{ items: AdminStore[] }>('/stores').then((res) => setStores(res.items)).catch(() => { /* filtr işləməsə də səhifə açılsın */ })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    api<Paged<StoreEvent>>('/events', { query: { type, storeId, sort: 'date', page, limit: LIMIT }, signal: controller.signal })
      .then((res) => { setData(res); setError('') })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setError(err instanceof ApiError ? err.message : 'Siyahı yüklənmədi')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [type, storeId, page, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])
  const openCreate = () => { setEditing(null); setFormOpen(true) }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api(`/admin/events/${deleting.id}`, { method: 'DELETE' })
      toast.success('Tədbir silindi')
      if (data && data.items.length === 1 && page > 1) setPage(page - 1)
      else reload()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Silinmədi')
    } finally {
      setDeleteBusy(false)
      setDeleting(null)
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <PageHeader
        title="Tədbirlər"
        description="Mağazalarda keçirilən görüşlər və tədbirlər."
        actions={
          <Button icon={<Plus size={16} />} onClick={openCreate} disabled={stores.length === 0}>Yeni tədbir</Button>
        }
      />

      <Card className="mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:max-w-xl">
        <Select options={TYPE_FILTER} value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} aria-label="Növ" />
        <Select
          options={[{ value: '', label: 'Bütün mağazalar' }, ...stores.map((s) => ({ value: String(s.id), label: s.name }))]}
          value={storeId}
          onChange={(e) => { setStoreId(e.target.value); setPage(1) }}
          aria-label="Mağaza"
        />
      </Card>

      <Card className="overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="secondary" className="mt-3" onClick={reload}>Yenidən cəhd et</Button>
          </div>
        ) : !data ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={<CalendarDays size={22} />} title="Tədbir tapılmadı"
            description={stores.length === 0 ? 'Əvvəlcə mağaza əlavə edin.' : 'Filtri dəyişin və ya yeni tədbir əlavə edin.'} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Tədbir</th>
                  <th className="px-3 py-3">Mağaza</th>
                  <th className="px-3 py-3">Tarix</th>
                  <th className="px-3 py-3">Növ</th>
                  <th className="px-3 py-3">Format</th>
                  <th className="px-5 py-3 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((ev) => (
                  <tr key={ev.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                    <td className="px-5 py-3 font-medium text-ink">{ev.title}</td>
                    <td className="px-3 py-3 text-muted">{ev.storeName}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted">
                      {formatDate(ev.date)} · {ev.time}
                      {ev.date < today && <span className="ml-2 text-xs">(keçib)</span>}
                    </td>
                    <td className="px-3 py-3"><Badge tone="info">{EVENT_TYPE_LABEL[ev.type]}</Badge></td>
                    <td className="px-3 py-3"><Badge>{EVENT_LOCATION_LABEL[ev.locationType]}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" aria-label="Redaktə" onClick={() => { setEditing(ev); setFormOpen(true) }}><Pencil size={15} /></Button>
                        <Button variant="ghost" size="sm" aria-label="Sil" className="hover:!text-danger" onClick={() => setDeleting(ev)}><Trash2 size={15} /></Button>
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

      <EventForm open={formOpen} event={editing} stores={stores} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); reload() }} />

      <ConfirmDialog
        open={deleting !== null}
        title="Tədbiri sil"
        message={deleting ? `“${deleting.title}” silinəcək. Davam edək?` : ''}
        confirmText="Sil"
        danger
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
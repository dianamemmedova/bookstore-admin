import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import BookCover from '../components/ui/BookCover'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { ConfirmDialog } from '../components/ui/Modal'
import BookForm from '../components/books/BookForm'
import { ApiError, api } from '../lib/api'
import { formatMoney } from '../lib/format'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../context/ToastContext'
import type { AdminBook, Paged } from '../types/book'

const LIMIT = 10

const STOCK_OPTIONS = [
  { value: '', label: 'Bütün stoklar' },
  { value: 'in', label: 'Stokda var' },
  { value: 'low', label: 'Az qalıb (≤5)' },
  { value: 'out', label: 'Qurtarıb' },
  { value: 'unlimited', label: 'Limitsiz' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Ən yeni' },
  { value: 'title', label: 'Ada görə' },
  { value: 'year-desc', label: 'İl (yeni → köhnə)' },
  { value: 'price-asc', label: 'Qiymət ↑' },
  { value: 'price-desc', label: 'Qiymət ↓' },
]

function StockBadge({ stock }: { stock: number | null }) {
  if (stock === null) return <Badge tone="info">Limitsiz</Badge>
  if (stock === 0) return <Badge tone="danger">Qurtarıb</Badge>
  if (stock <= 5) return <Badge tone="warning">{stock} ədəd</Badge>
  return <Badge tone="success">{stock} ədəd</Badge>
}

export default function BooksPage() {
  const toast = useToast()
  const [data, setData] = useState<Paged<AdminBook> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('')
  const [stockStatus, setStockStatus] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  const q = useDebounce(search)
  const subjectQ = useDebounce(subject)
  const minQ = useDebounce(minPrice)
  const maxQ = useDebounce(maxPrice)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminBook | null>(null)
  const [deleting, setDeleting] = useState<AdminBook | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  // Filtr dəyişəndə 1-ci səhifəyə qayıdırıq
  const changeFilter = (fn: () => void) => { fn(); setPage(1) }

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    api<{ items: AdminBook[]; page: number; limit: number; total: number; totalPages: number }>('/admin/books', {
      query: { q, subject: subjectQ, stockStatus, minPrice: minQ, maxPrice: maxQ, sort, page, limit: LIMIT },
      signal: controller.signal,
    })
      .then((res) => { setData({ ...res, items: res.items }); setError('') })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setError(err instanceof ApiError ? err.message : 'Siyahı yüklənmədi')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [q, subjectQ, stockStatus, minQ, maxQ, sort, page, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (b: AdminBook) => { setEditing(b); setFormOpen(true) }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api(`/admin/books/${deleting.id}`, { method: 'DELETE' })
      toast.success('Kitab silindi')
      setDeleting(null)
      // Son səhifədəki yeganə kitab silinibsə bir səhifə geri
      if (data && data.items.length === 1 && page > 1) setPage(page - 1)
      else reload()
    } catch (err) {
      toast.error(err instanceof ApiError && err.status === 409
        ? 'Bu kitab sifarişlərdə var, silmək olmaz. Stoku 0 edə bilərsiniz.'
        : err instanceof ApiError ? err.message : 'Silinmədi')
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  const hasFilters = Boolean(search || subject || stockStatus || minPrice || maxPrice)
  const clearFilters = () => { setSearch(''); setSubject(''); setStockStatus(''); setMinPrice(''); setMaxPrice(''); setPage(1) }

  return (
    <>
      <PageHeader
        title="Kitablar"
        description="Kataloqu idarə edin: əlavə, redaktə, stok və üz qabığı."
        actions={<Button icon={<Plus size={16} />} onClick={openCreate}>Yeni kitab</Button>}
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Input className="lg:col-span-2" placeholder="Ad və ya müəllif axtar…" icon={<Search size={16} />} value={search} onChange={(e) => changeFilter(() => setSearch(e.target.value))} />
          <Input placeholder="Janr (fantasy)" value={subject} onChange={(e) => changeFilter(() => setSubject(e.target.value))} />
          <Select options={STOCK_OPTIONS} value={stockStatus} onChange={(e) => changeFilter(() => setStockStatus(e.target.value))} aria-label="Stok" />
          <div className="flex gap-2">
            <Input placeholder="Min ₼" inputMode="decimal" value={minPrice} onChange={(e) => changeFilter(() => setMinPrice(e.target.value))} />
            <Input placeholder="Max ₼" inputMode="decimal" value={maxPrice} onChange={(e) => changeFilter(() => setMaxPrice(e.target.value))} />
          </div>
          <Select options={SORT_OPTIONS} value={sort} onChange={(e) => changeFilter(() => setSort(e.target.value))} aria-label="Sıralama" />
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="mt-3 text-xs font-medium text-primary hover:underline">Filtrləri təmizlə</button>
        )}
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
          <EmptyState
            icon={<BookOpen size={22} />}
            title={hasFilters ? 'Nəticə tapılmadı' : 'Hələ kitab yoxdur'}
            description={hasFilters ? 'Filtrləri dəyişib yenidən yoxlayın.' : 'İlk kitabı əlavə edin.'}
            action={!hasFilters ? <Button icon={<Plus size={16} />} onClick={openCreate}>Yeni kitab</Button> : undefined}
          />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Kitab</th>
                  <th className="px-3 py-3">Janrlar</th>
                  <th className="px-3 py-3">Qiymət</th>
                  <th className="px-3 py-3">Stok</th>
                  <th className="px-5 py-3 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((b) => (
                  <tr key={b.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <BookCover url={b.coverUrl} title={b.title} className="h-14 w-10" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{b.title}</p>
                          <p className="truncate text-xs text-muted">{b.author}{b.year ? ` · ${b.year}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex max-w-[200px] flex-wrap gap-1">
                        {b.subjects.slice(0, 3).map((s) => <Badge key={s}>{s}</Badge>)}
                        {b.subjects.length > 3 && <span className="text-xs text-muted">+{b.subjects.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium text-ink whitespace-nowrap">{formatMoney(b.priceCents)}</td>
                    <td className="px-3 py-3"><StockBadge stock={b.stock} /></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(b)} aria-label="Redaktə"><Pencil size={15} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(b)} aria-label="Sil" className="hover:!text-danger"><Trash2 size={15} /></Button>
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

      <BookForm
        open={formOpen}
        book={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); reload() }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Kitabı sil"
        message={deleting ? `“${deleting.title}” kitabı həmişəlik silinəcək. Davam edək?` : ''}
        confirmText="Sil"
        danger
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, BookOpen, Mail, Package, RefreshCw, ShoppingBag, Star, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { formatMoney, formatNumber } from '../lib/format'
import type { LowStockBook, OrderStatus, Overview, Sales, TopBook } from '../types/stats'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import BookCover from '../components/ui/BookCover'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import StatCard from '../components/dashboard/StatCard'
import SalesChart from '../components/dashboard/SalesChart'

const PERIODS = [7, 30, 90] as const

const STATUS_META: Record<OrderStatus, { label: string; bar: string }> = {
  PENDING: { label: 'Gözləyir', bar: 'bg-warning' },
  CONFIRMED: { label: 'Təsdiqlənib', bar: 'bg-info' },
  DELIVERED: { label: 'Çatdırılıb', bar: 'bg-success' },
  CANCELLED: { label: 'Ləğv edilib', bar: 'bg-danger' },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [days, setDays] = useState<number>(30)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [sales, setSales] = useState<Sales | null>(null)
  const [topBooks, setTopBooks] = useState<TopBook[]>([])
  const [lowStock, setLowStock] = useState<LowStockBook[]>([])
  const [loading, setLoading] = useState(true)
  const [salesLoading, setSalesLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [ov, sl, top, low] = await Promise.all([
        api<Overview>('/admin/stats/overview'),
        api<Sales>('/admin/stats/sales', { query: { days } }),
        api<{ items: TopBook[] }>('/admin/stats/top-books', { query: { limit: 5 } }),
        api<{ items: LowStockBook[] }>('/admin/stats/low-stock', { query: { threshold: 5, limit: 6 } }),
      ])
      setOverview(ov)
      setSales(sl)
      setTopBooks(top.items)
      setLowStock(low.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Məlumatları yükləmək mümkün olmadı.')
    } finally {
      setLoading(false)
    }
    // days yalnız ilk yükləmədə lazımdır; sonradan dövr dəyişəndə yalnız qrafik yenilənir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  const changePeriod = async (next: number) => {
    if (next === days) return
    setDays(next)
    setSalesLoading(true)
    try {
      setSales(await api<Sales>('/admin/stats/sales', { query: { days: next } }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Qrafiki yükləmək mümkün olmadı.')
    } finally {
      setSalesLoading(false)
    }
  }

  if (loading) return <Spinner />

  if (error && !overview) {
    return (
      <Card>
        <EmptyState
          icon={<AlertTriangle size={22} />}
          title="Məlumat yüklənmədi"
          description={error}
          action={<Button onClick={load} icon={<RefreshCw size={16} />}>Yenidən cəhd et</Button>}
        />
      </Card>
    )
  }

  if (!overview || !sales) return null

  const statusTotal = Math.max(overview.orders.total, 1)

  return (
    <>
      <PageHeader
        title={`Xoş gəldin, ${user?.firstName}!`}
        description="Mağazanın ümumi vəziyyəti"
        actions={<Button variant="secondary" size="sm" onClick={load} icon={<RefreshCw size={14} />}>Yenilə</Button>}
      />

      {error && <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ümumi gəlir"
          value={formatMoney(overview.revenue.grossCents)}
          hint={<>Çatdırılmış: <span className="font-medium text-ink">{formatMoney(overview.revenue.deliveredCents)}</span></>}
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          label="Sifarişlər"
          value={formatNumber(overview.orders.total)}
          hint={<><span className="font-medium text-ink">{overview.orders.byStatus.PENDING}</span> sifariş təsdiq gözləyir</>}
          icon={<ShoppingBag size={20} />}
          tone="info"
        />
        <StatCard
          label="İstifadəçilər"
          value={formatNumber(overview.users.total)}
          hint={<>Son 30 gündə <span className="font-medium text-ink">+{overview.users.newLast30Days}</span> yeni</>}
          icon={<Users size={20} />}
          tone="success"
        />
        <StatCard
          label="Kitablar"
          value={formatNumber(overview.books.total)}
          hint={<><span className="font-medium text-danger">{overview.books.outOfStock}</span> qurtarıb · <span className="font-medium text-warning">{overview.books.lowStock}</span> azalıb</>}
          icon={<BookOpen size={20} />}
          tone="warning"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Satışlar"
            action={
              <div className="flex rounded-lg border border-line p-0.5">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => changePeriod(p)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${days === p ? 'bg-primary text-white' : 'text-muted hover:text-ink'}`}
                  >
                    {p} gün
                  </button>
                ))}
              </div>
            }
          />
          <div className="px-5 pb-4 pt-4">
            <div className="mb-3 flex flex-wrap gap-x-8 gap-y-1">
              <div>
                <p className="text-xs text-muted">Bu dövrdə gəlir</p>
                <p className="text-xl font-semibold text-ink">{formatMoney(sales.totalRevenueCents)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Sifariş sayı</p>
                <p className="text-xl font-semibold text-ink">{formatNumber(sales.totalOrders)}</p>
              </div>
            </div>
            <div className={salesLoading ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
              <SalesChart series={sales.series} />
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Sifariş statusları" />
            <div className="space-y-4 p-5">
              {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => {
                const count = overview.orders.byStatus[s]
                return (
                  <div key={s}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-ink">{STATUS_META[s].label}</span>
                      <span className="font-medium text-ink">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div className={`h-full rounded-full ${STATUS_META[s].bar}`} style={{ width: `${(count / statusTotal) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="Digər göstəricilər" />
            <ul className="divide-y divide-line">
              <li className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="flex items-center gap-2 text-muted"><Mail size={16} /> Oxunmamış mesaj</span>
                <Link to="/messages" className="font-semibold text-ink hover:text-primary">{overview.inbox.unreadContactMessages}</Link>
              </li>
              <li className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="flex items-center gap-2 text-muted"><Package size={16} /> Bülleten abunəçisi</span>
                <Link to="/newsletter" className="font-semibold text-ink hover:text-primary">{overview.inbox.activeSubscribers}</Link>
              </li>
              <li className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="flex items-center gap-2 text-muted"><Star size={16} /> Orta rəy ({overview.reviews.total})</span>
                <span className="font-semibold text-ink">{overview.reviews.total > 0 ? `${overview.reviews.avgRating} / 5` : '—'}</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Ən çox satılan kitablar" />
          {topBooks.length === 0 ? (
            <EmptyState icon={<TrendingUp size={22} />} title="Hələ satış yoxdur" description="İlk sifariş gələndə ən çox satılan kitablar burada görünəcək." />
          ) : (
            <ul className="divide-y divide-line">
              {topBooks.map((b, i) => (
                <li key={b.bookId} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 text-center text-sm font-semibold text-muted">{i + 1}</span>
                  <BookCover url={b.coverUrl} title={b.title} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{b.title}</p>
                    <p className="truncate text-xs text-muted">{b.author}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{b.quantitySold} ədəd</p>
                    <p className="text-xs text-muted">{formatMoney(b.revenueCents)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Stoku azalan kitablar"
            action={<Link to="/books" className="text-xs font-medium text-primary hover:underline">Hamısına bax</Link>}
          />
          {lowStock.length === 0 ? (
            <EmptyState icon={<Package size={22} />} title="Hər şey qaydasındadır" description="Stoku az qalan kitab yoxdur." />
          ) : (
            <ul className="divide-y divide-line">
              {lowStock.map((b) => (
                <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                  <BookCover url={b.coverUrl} title={b.title} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{b.title}</p>
                    <p className="truncate text-xs text-muted">{b.author}</p>
                  </div>
                  <Badge tone={b.stock === 0 ? 'danger' : 'warning'}>{b.stock === 0 ? 'Qurtarıb' : `${b.stock} ədəd qalıb`}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
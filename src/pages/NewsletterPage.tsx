import { useEffect, useState } from 'react'
import { Newspaper } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { ApiError, api } from '../lib/api'
import { formatDateTime } from '../lib/format'
import type { SubscriberList } from '../types/newsletter'

const LIMIT = 15

const TABS: { value: '' | 'true' | 'false'; label: string }[] = [
  { value: '', label: 'Hamısı' },
  { value: 'true', label: 'Aktiv' },
  { value: 'false', label: 'Çıxanlar' },
]

export default function NewsletterPage() {
  const [data, setData] = useState<SubscriberList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [active, setActive] = useState<'' | 'true' | 'false'>('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    api<SubscriberList>('/admin/newsletter', { query: { active, page, limit: LIMIT }, signal: controller.signal })
      .then((res) => { setData(res); setError('') })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setError(err instanceof ApiError ? err.message : 'Siyahı yüklənmədi')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [active, page, reloadKey])

  return (
    <>
      <PageHeader
        title="Bülleten"
        description={data ? `${data.activeCount} aktiv abunəçi` : 'E-poçt abunəçiləri'}
      />

      <div className="mb-4 flex gap-1 rounded-xl border border-line bg-surface p-1 sm:w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setActive(t.value); setPage(1) }}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
              active === t.value ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-surface-2 hover:text-ink'
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
          <EmptyState icon={<Newspaper size={22} />} title="Abunəçi tapılmadı" description="Saytın alt hissəsindəki forma ilə abunə olanlar burada görünəcək." />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">E-poçt</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Abunə tarixi</th>
                  <th className="px-5 py-3">Çıxış tarixi</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                    <td className="px-5 py-3 font-medium text-ink">{s.email}</td>
                    <td className="px-3 py-3"><Badge tone={s.isActive ? 'success' : 'neutral'}>{s.isActive ? 'Aktiv' : 'Çıxıb'}</Badge></td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted">{formatDateTime(s.subscribedAt)}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-muted">{s.unsubscribedAt ? formatDateTime(s.unsubscribedAt) : '—'}</td>
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
    </>
  )
}
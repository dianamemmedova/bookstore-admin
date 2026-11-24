import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { ApiError, api } from '../lib/api'
import { formatDate, initials } from '../lib/format'
import type { AdminUser } from '../context/AuthContext'
import type { Paged } from '../types/book'

const LIMIT = 15

export default function UsersPage() {
  const [data, setData] = useState<Paged<AdminUser> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    api<Paged<AdminUser>>('/admin/users', { query: { page, limit: LIMIT }, signal: controller.signal })
      .then((res) => { setData(res); setError('') })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setError(err instanceof ApiError ? err.message : 'Siyahı yüklənmədi')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [page, reloadKey])

  return (
    <>
      <PageHeader
        title="İstifadəçilər"
        description={data ? `Cəmi ${data.total} qeydiyyatlı istifadəçi` : 'Qeydiyyatdan keçmiş istifadəçilər'}
      />

      <Card className="overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="secondary" className="mt-3" onClick={() => setReloadKey((k) => k + 1)}>Yenidən cəhd et</Button>
          </div>
        ) : !data ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={<Users size={22} />} title="İstifadəçi yoxdur" />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">İstifadəçi</th>
                  <th className="px-3 py-3">E-poçt</th>
                  <th className="px-3 py-3">Rol</th>
                  <th className="px-5 py-3">Qeydiyyat tarixi</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                          {initials(u.firstName, u.lastName)}
                        </span>
                        <span className="font-medium text-ink">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted">{u.email}</td>
                    <td className="px-3 py-3">
                      <Badge tone={u.role === 'ADMIN' ? 'info' : 'neutral'}>{u.role === 'ADMIN' ? 'Admin' : 'İstifadəçi'}</Badge>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-muted">{formatDate(u.createdAt)}</td>
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
import { useCallback, useEffect, useState } from 'react'
import { Mail, MailOpen, Trash2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import Modal, { ConfirmDialog } from '../components/ui/Modal'
import { ApiError, api } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { useToast } from '../context/ToastContext'
import type { ContactMessage, MessageList } from '../types/message'

const LIMIT = 10

export default function MessagesPage() {
  const toast = useToast()
  const [data, setData] = useState<MessageList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [deleting, setDeleting] = useState<ContactMessage | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    api<MessageList>('/admin/contact-messages', {
      query: { page, limit: LIMIT, unread: unreadOnly ? 'true' : undefined },
      signal: controller.signal,
    })
      .then((res) => { setData(res); setError('') })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setError(err instanceof ApiError ? err.message : 'Siyahı yüklənmədi')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [page, unreadOnly, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  const setRead = async (m: ContactMessage, isRead: boolean) => {
    try {
      const updated = await api<ContactMessage>(`/admin/contact-messages/${m.id}`, { method: 'PATCH', body: { isRead } })
      setSelected((cur) => (cur && cur.id === m.id ? updated : cur))
      reload()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Dəyişmədi')
    }
  }

  // Mesajı açanda avtomatik oxunmuş olur
  const open = (m: ContactMessage) => {
    setSelected(m)
    if (!m.isRead) setRead(m, true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api(`/admin/contact-messages/${deleting.id}`, { method: 'DELETE' })
      toast.success('Mesaj silindi')
      if (selected?.id === deleting.id) setSelected(null)
      setDeleting(null)
      if (data && data.items.length === 1 && page > 1) setPage(page - 1)
      else reload()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Silinmədi')
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Mesajlar"
        description={data ? `${data.unreadCount} oxunmamış mesaj` : 'Əlaqə formasından gələn mesajlar'}
      />

      <div className="mb-4 flex gap-1 rounded-xl border border-line bg-surface p-1 sm:w-fit">
        {[{ v: false, l: 'Hamısı' }, { v: true, l: 'Oxunmamış' }].map((t) => (
          <button
            key={String(t.v)}
            onClick={() => { setUnreadOnly(t.v); setPage(1) }}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
              unreadOnly === t.v ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-surface-2 hover:text-ink'
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="secondary" className="mt-3" onClick={reload}>Yenidən cəhd et</Button>
          </div>
        ) : !data ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={<Mail size={22} />} title="Mesaj yoxdur" description={unreadOnly ? 'Oxunmamış mesaj qalmayıb.' : 'Hələ mesaj gəlməyib.'} />
        ) : (
          <ul className={`divide-y divide-line transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {data.items.map((m) => (
              <li key={m.id} onClick={() => open(m)} className="flex cursor-pointer items-start gap-3 px-5 py-4 hover:bg-surface-2/60">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.isRead ? 'bg-transparent' : 'bg-primary'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm ${m.isRead ? 'text-ink' : 'font-semibold text-ink'}`}>{m.name}</p>
                    <Badge>{m.subject}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">{m.message}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">{formatDateTime(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
        {data && data.items.length > 0 && (
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onChange={setPage} />
        )}
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.subject ?? ''}
        footer={selected && (
          <>
            <Button variant="danger" className="mr-auto" icon={<Trash2 size={16} />} onClick={() => setDeleting(selected)}>Sil</Button>
            <Button variant="secondary" icon={<MailOpen size={16} />} onClick={() => setRead(selected, !selected.isRead)}>
              {selected.isRead ? 'Oxunmamış et' : 'Oxunmuş et'}
            </Button>
            <a href={`mailto:${selected.email}?subject=${encodeURIComponent('Re: ' + selected.subject)}`}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover">
              Cavab yaz
            </a>
          </>
        )}
      >
        {selected && (
          <div className="space-y-4">
            <div className="text-sm">
              <p className="font-medium text-ink">{selected.name}</p>
              <p className="text-muted">{selected.email} · {formatDateTime(selected.createdAt)}</p>
            </div>
            <p className="whitespace-pre-wrap rounded-lg bg-surface-2 p-4 text-sm leading-relaxed text-ink">{selected.message}</p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Mesajı sil"
        message="Mesaj həmişəlik silinəcək. Davam edək?"
        confirmText="Sil"
        danger
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
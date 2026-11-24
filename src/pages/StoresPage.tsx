import { useCallback, useEffect, useState } from 'react'
import { Clock, MapPin, Pencil, Phone, Plus, Store, Trash2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/Modal'
import StoreForm from '../components/stores/StoreForm'
import { ApiError, api } from '../lib/api'
import { useToast } from '../context/ToastContext'
import type { AdminStore } from '../types/store'

export default function StoresPage() {
  const toast = useToast()
  const [stores, setStores] = useState<AdminStore[] | null>(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminStore | null>(null)
  const [deleting, setDeleting] = useState<AdminStore | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    api<{ items: AdminStore[] }>('/stores', { signal: controller.signal })
      .then((res) => { setStores(res.items); setError('') })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setError(err instanceof ApiError ? err.message : 'Siyahı yüklənmədi')
      })
    return () => controller.abort()
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])
  const openCreate = () => { setEditing(null); setFormOpen(true) }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api(`/admin/stores/${deleting.id}`, { method: 'DELETE' })
      toast.success('Mağaza silindi')
      reload()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Silinmədi')
    } finally {
      setDeleteBusy(false)
      setDeleting(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Mağazalar"
        description="Fiziki mağazaların ünvanı, əlaqə və iş saatları."
        actions={<Button icon={<Plus size={16} />} onClick={openCreate}>Yeni mağaza</Button>}
      />

      {error ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-danger">{error}</p>
          <Button variant="secondary" className="mt-3" onClick={reload}>Yenidən cəhd et</Button>
        </Card>
      ) : !stores ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : stores.length === 0 ? (
        <Card>
          <EmptyState icon={<Store size={22} />} title="Mağaza yoxdur" description="İlk mağazanı əlavə edin."
            action={<Button icon={<Plus size={16} />} onClick={openCreate}>Yeni mağaza</Button>} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stores.map((s) => (
            <Card key={s.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-ink">{s.name}</h3>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" aria-label="Redaktə" onClick={() => { setEditing(s); setFormOpen(true) }}><Pencil size={15} /></Button>
                  <Button variant="ghost" size="sm" aria-label="Sil" className="hover:!text-danger" onClick={() => setDeleting(s)}><Trash2 size={15} /></Button>
                </div>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-primary" />{s.address}</li>
                <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-primary" />{s.phone}</li>
                <li className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-primary" />{s.hours}</li>
              </ul>
              <a
                href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 text-xs font-medium text-primary hover:underline"
              >
                Xəritədə aç ({s.lat.toFixed(4)}, {s.lng.toFixed(4)})
              </a>
            </Card>
          ))}
        </div>
      )}

      <StoreForm open={formOpen} store={editing} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); reload() }} />

      <ConfirmDialog
        open={deleting !== null}
        title="Mağazanı sil"
        message={deleting ? `“${deleting.name}” silinəcək. Bu mağazaya bağlı bütün tədbirlər də silinəcək. Davam edək?` : ''}
        confirmText="Sil"
        danger
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
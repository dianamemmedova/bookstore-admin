import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { ApiError, api } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import { EVENT_LOCATION_LABEL, EVENT_TYPE_LABEL } from '../../types/store'
import type { AdminStore, StoreEvent } from '../../types/store'

interface Props {
  open: boolean
  event: StoreEvent | null
  stores: AdminStore[]
  onClose: () => void
  onSaved: () => void
}

const TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => ({ value, label }))
const LOCATION_OPTIONS = Object.entries(EVENT_LOCATION_LABEL).map(([value, label]) => ({ value, label }))

export default function EventForm(props: Props) {
  return <EventFormInner key={props.open ? (props.event?.id ?? 'new') : 'closed'} {...props} />
}

function EventFormInner({ open, event, stores, onClose, onSaved }: Props) {
  const toast = useToast()
  const [form, setForm] = useState({
    storeId: event ? String(event.storeId) : stores[0] ? String(stores[0].id) : '',
    title: event?.title ?? '',
    type: event?.type ?? 'AUTHOR',
    locationType: event?.locationType ?? 'IN_STORE',
    date: event?.date ?? '',
    time: event?.time ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!form.storeId) next.storeId = 'Mağaza seçin'
    if (!form.title.trim()) next.title = 'Başlıq boş ola bilməz'
    if (!form.date) next.date = 'Tarix seçin'
    if (!form.time) next.time = 'Saat seçin'
    if (Object.keys(next).length) return setErrors(next)

    const payload = { ...form, storeId: Number(form.storeId), title: form.title.trim() }

    setSaving(true)
    try {
      if (event) await api(`/admin/events/${event.id}`, { method: 'PATCH', body: payload })
      else await api('/admin/events', { method: 'POST', body: payload })
      toast.success(event ? 'Tədbir yeniləndi' : 'Tədbir əlavə olundu')
      onSaved()
    } catch (err) {
      if (err instanceof ApiError) {
        const fields = err.fieldErrors()
        if (Object.keys(fields).length) setErrors(fields)
        else toast.error(err.message)
      } else toast.error('Gözlənilməz xəta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event ? 'Tədbiri redaktə et' : 'Yeni tədbir'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Ləğv et</Button>
          <Button type="submit" form="event-form" loading={saving}>{event ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </>
      }
    >
      <form id="event-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Input className="sm:col-span-2" label="Başlıq *" name="title" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />
        <div className="sm:col-span-2">
          <Select label="Mağaza *" name="storeId" value={form.storeId} onChange={(e) => set('storeId', e.target.value)}
            options={stores.map((s) => ({ value: String(s.id), label: s.name }))} />
          {errors.storeId && <p className="mt-1 text-xs text-danger">{errors.storeId}</p>}
        </div>
        <Select label="Növ" name="type" value={form.type} onChange={(e) => set('type', e.target.value)} options={TYPE_OPTIONS} />
        <Select label="Format" name="locationType" value={form.locationType} onChange={(e) => set('locationType', e.target.value)} options={LOCATION_OPTIONS} />
        <Input label="Tarix *" name="date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} error={errors.date} />
        <Input label="Saat *" name="time" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} error={errors.time} />
      </form>
    </Modal>
  )
}
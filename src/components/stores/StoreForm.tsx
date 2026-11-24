import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { ApiError, api } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import type { AdminStore } from '../../types/store'

interface Props {
  open: boolean
  store: AdminStore | null
  onClose: () => void
  onSaved: () => void
}

export default function StoreForm(props: Props) {
  return <StoreFormInner key={props.open ? (props.store?.id ?? 'new') : 'closed'} {...props} />
}

function StoreFormInner({ open, store, onClose, onSaved }: Props) {
  const toast = useToast()
  const [form, setForm] = useState({
    name: store?.name ?? '',
    address: store?.address ?? '',
    phone: store?.phone ?? '',
    hours: store?.hours ?? '',
    lat: store ? String(store.lat) : '',
    lng: store ? String(store.lng) : '',
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
    const lat = Number(form.lat.replace(',', '.'))
    const lng = Number(form.lng.replace(',', '.'))
    if (!form.name.trim()) next.name = 'Ad boş ola bilməz'
    if (!form.address.trim()) next.address = 'Ünvan boş ola bilməz'
    if (!/^[+]?[\d\s\-()]{7,20}$/.test(form.phone.trim())) next.phone = 'Düzgün telefon nömrəsi daxil edin'
    if (!form.hours.trim()) next.hours = 'İş saatları boş ola bilməz'
    if (!form.lat.trim() || !Number.isFinite(lat) || lat < -90 || lat > 90) next.lat = '-90 ilə 90 arasında olmalıdır'
    if (!form.lng.trim() || !Number.isFinite(lng) || lng < -180 || lng > 180) next.lng = '-180 ilə 180 arasında olmalıdır'
    if (Object.keys(next).length) return setErrors(next)

    const payload = { name: form.name.trim(), address: form.address.trim(), phone: form.phone.trim(), hours: form.hours.trim(), lat, lng }

    setSaving(true)
    try {
      if (store) await api(`/admin/stores/${store.id}`, { method: 'PATCH', body: payload })
      else await api('/admin/stores', { method: 'POST', body: payload })
      toast.success(store ? 'Mağaza yeniləndi' : 'Mağaza əlavə olundu')
      onSaved()
    } catch (err) {
      if (err instanceof ApiError) {
        const fields = err.fieldErrors()
        if (Object.keys(fields).length) setErrors(fields)
        else if (err.code === 'STORE_NAME_TAKEN') setErrors({ name: err.message })
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
      title={store ? 'Mağazanı redaktə et' : 'Yeni mağaza'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Ləğv et</Button>
          <Button type="submit" form="store-form" loading={saving}>{store ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </>
      }
    >
      <form id="store-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Input className="sm:col-span-2" label="Ad *" name="name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        <Input className="sm:col-span-2" label="Ünvan *" name="address" value={form.address} onChange={(e) => set('address', e.target.value)} error={errors.address} />
        <Input label="Telefon *" name="phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} hint="+994 12 345 67 89" />
        <Input label="İş saatları *" name="hours" value={form.hours} onChange={(e) => set('hours', e.target.value)} error={errors.hours} hint="Məs. 10:00 – 22:00" />
        <Input label="Enlik (lat) *" name="lat" inputMode="decimal" value={form.lat} onChange={(e) => set('lat', e.target.value)} error={errors.lat} hint="Məs. 40.4093" />
        <Input label="Uzunluq (lng) *" name="lng" inputMode="decimal" value={form.lng} onChange={(e) => set('lng', e.target.value)} error={errors.lng} hint="Məs. 49.8671" />
      </form>
    </Modal>
  )
}
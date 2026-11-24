import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { ApiError, api } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import type { AdminPromo } from '../../types/promo'

interface Props {
  open: boolean
  promo: AdminPromo | null // null = yeni kod
  onClose: () => void
  onSaved: () => void
}

interface FormState { code: string; percent: string; description: string; isActive: boolean; expires: string }

// Bakı vaxtı ilə YYYY-MM-DD
function toDateInput(iso: string | null): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku' }).format(new Date(iso))
}

// Seçilən günün sonu (Bakı vaxtı) ISO formatında
function endOfDayIso(date: string): string {
  return new Date(`${date}T23:59:59+04:00`).toISOString()
}

export default function PromoForm(props: Props) {
  return <PromoFormInner key={props.open ? (props.promo?.id ?? 'new') : 'closed'} {...props} />
}

function PromoFormInner({ open, promo, onClose, onSaved }: Props) {
  const toast = useToast()
  const [form, setForm] = useState<FormState>({
    code: promo?.code ?? '',
    percent: promo ? String(promo.discountPercent) : '',
    description: promo?.description ?? '',
    isActive: promo?.isActive ?? true,
    expires: toDateInput(promo?.expiresAt ?? null),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    const percent = Number(form.percent)
    if (!promo && !/^[A-Za-z0-9_-]{3,30}$/.test(form.code.trim())) next.code = '3-30 simvol: hərf, rəqəm, _ və -'
    if (!Number.isInteger(percent) || percent < 1 || percent > 90) next.discountPercent = 'Endirim 1 ilə 90 arasında tam ədəd olmalıdır'
    if (Object.keys(next).length) return setErrors(next)

    const common = {
      discountPercent: percent,
      description: form.description.trim() || null,
      isActive: form.isActive,
      expiresAt: form.expires ? endOfDayIso(form.expires) : null,
    }

    setSaving(true)
    try {
      if (promo) await api(`/admin/promos/${promo.id}`, { method: 'PATCH', body: common })
      else await api('/admin/promos', { method: 'POST', body: { code: form.code.trim(), ...common } })
      toast.success(promo ? 'Promo kod yeniləndi' : 'Promo kod yaradıldı')
      onSaved()
    } catch (err) {
      if (err instanceof ApiError) {
        const fields = err.fieldErrors()
        if (Object.keys(fields).length) setErrors(fields)
        else if (err.code === 'PROMO_CODE_TAKEN') setErrors({ code: 'Bu kod artıq mövcuddur' })
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
      title={promo ? `Redaktə: ${promo.code}` : 'Yeni promo kod'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Ləğv et</Button>
          <Button type="submit" form="promo-form" loading={saving}>{promo ? 'Yadda saxla' : 'Yarat'}</Button>
        </>
      }
    >
      <form id="promo-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Input
          label="Kod *"
          name="code"
          value={form.code}
          disabled={promo !== null}
          onChange={(e) => set('code', e.target.value.toUpperCase())}
          error={errors.code}
          hint={promo ? 'Kod dəyişdirilmir' : 'Məs. YAZ25'}
        />
        <Input label="Endirim (%) *" name="discountPercent" inputMode="numeric" value={form.percent} onChange={(e) => set('percent', e.target.value)} error={errors.discountPercent} hint="1–90" />
        <Input className="sm:col-span-2" label="Açıqlama" name="description" value={form.description} onChange={(e) => set('description', e.target.value)} error={errors.description} />
        <Input label="Bitmə tarixi" name="expires" type="date" value={form.expires} onChange={(e) => set('expires', e.target.value)} error={errors.expiresAt} hint="Boş = müddətsiz" />
        <label className="flex items-center gap-2 self-center pt-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
          Aktivdir
        </label>
      </form>
    </Modal>
  )
}
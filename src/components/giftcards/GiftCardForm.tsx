import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { ApiError, api } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import type { AdminGiftCard } from '../../types/giftCard'

interface Props {
  open: boolean
  card: AdminGiftCard | null // null = yeni kart
  onClose: () => void
  onSaved: (created?: AdminGiftCard) => void
}

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku' }).format(new Date(iso))
}

const endOfDayIso = (date: string) => new Date(`${date}T23:59:59+04:00`).toISOString()

export default function GiftCardForm(props: Props) {
  return <GiftCardFormInner key={props.open ? (props.card?.id ?? 'new') : 'closed'} {...props} />
}

function GiftCardFormInner({ open, card, onClose, onSaved }: Props) {
  const toast = useToast()
  const [amount, setAmount] = useState('')
  const [expires, setExpires] = useState(toDateInput(card?.expiresAt ?? null))
  const [note, setNote] = useState(card?.note ?? '')
  const [isActive, setIsActive] = useState(card?.isActive ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const common = { expiresAt: expires ? endOfDayIso(expires) : null, note: note.trim() || null }

    if (!card) {
      const value = Number(amount.replace(',', '.'))
      if (!Number.isFinite(value) || value <= 0 || value > 1000) return setErrors({ amount: 'Məbləğ 0-dan böyük, ən çox 1000 ₼ olmalıdır' })
    }

    setSaving(true)
    try {
      if (card) {
        await api(`/admin/gift-cards/${card.id}`, { method: 'PATCH', body: { ...common, isActive } })
        toast.success('Kart yeniləndi')
        onSaved()
      } else {
        const created = await api<AdminGiftCard>('/admin/gift-cards', { method: 'POST', body: { amount: Number(amount.replace(',', '.')), ...common } })
        toast.success('Hədiyyə kartı yaradıldı')
        onSaved(created)
      }
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
      title={card ? 'Kartı redaktə et' : 'Yeni hədiyyə kartı'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Ləğv et</Button>
          <Button type="submit" form="giftcard-form" loading={saving}>{card ? 'Yadda saxla' : 'Yarat'}</Button>
        </>
      }
    >
      <form id="giftcard-form" onSubmit={submit} className="space-y-4" noValidate>
        {!card && (
          <Input label="Məbləğ (₼) *" name="amount" inputMode="decimal" value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors({}) }} error={errors.amount} hint="Maksimum 1000 ₼. Kart nömrəsi avtomatik yaradılır." />
        )}
        <Input label="Bitmə tarixi" name="expires" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} error={errors.expiresAt} hint="Boş = müddətsiz" />
        <Input label="Qeyd" name="note" value={note} onChange={(e) => setNote(e.target.value)} error={errors.note} hint="Daxili qeyd, müştəri görmür" />
        {card && (
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
            Aktivdir
          </label>
        )}
      </form>
    </Modal>
  )
}
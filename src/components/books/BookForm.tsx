import { useState } from 'react'
import type { FormEvent } from 'react'
import { ImagePlus } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import BookCover from '../ui/BookCover'
import { ApiError, api } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import type { AdminBook } from '../../types/book'

interface Props {
  open: boolean
  book: AdminBook | null // null = yeni kitab
  onClose: () => void
  onSaved: () => void
}

interface FormState {
  title: string
  author: string
  price: string
  unlimited: boolean
  stock: string
  year: string
  pages: string
  subjects: string
  description: string
}

const EMPTY: FormState = { title: '', author: '', price: '', unlimited: false, stock: '10', year: '', pages: '', subjects: '', description: '' }

function fromBook(b: AdminBook): FormState {
  return {
    title: b.title,
    author: b.author,
    price: String(b.price),
    unlimited: b.stock === null,
    stock: b.stock === null ? '10' : String(b.stock),
    year: b.year ? String(b.year) : '',
    pages: b.pages ? String(b.pages) : '',
    subjects: b.subjects.join(', '),
    description: b.description ?? '',
  }
}

const MAX_COVER = 2 * 1024 * 1024

// Modal hər açılanda yenidən qurulur (key ilə), ona görə state sıfırlama kodu lazım deyil
export default function BookForm(props: Props) {
  return <BookFormInner key={props.open ? (props.book?.id ?? 'new') : 'closed'} {...props} />
}

function BookFormInner({ open, book, onClose, onSaved }: Props) {
  const toast = useToast()
  const [form, setForm] = useState<FormState>(book ? fromBook(book) : EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverError, setCoverError] = useState('')

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const pickCover = (file: File | undefined) => {
    setCoverError('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setCoverError('Yalnız JPG, PNG və ya WEBP')
    if (file.size > MAX_COVER) return setCoverError('Şəkil 2 MB-dan böyük olmamalıdır')
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    const price = Number(form.price.replace(',', '.'))
    if (!form.title.trim()) next.title = 'Ad boş ola bilməz'
    if (!form.author.trim()) next.author = 'Müəllif boş ola bilməz'
    if (!form.price.trim() || !Number.isFinite(price) || price <= 0) next.price = 'Qiymət 0-dan böyük olmalıdır'
    if (!form.unlimited && !/^\d+$/.test(form.stock)) next.stock = 'Stok tam ədəd olmalıdır'
    if (form.year && !/^\d{4}$/.test(form.year)) next.year = 'İl 4 rəqəm olmalıdır'
    if (form.pages && !/^\d+$/.test(form.pages)) next.pages = 'Səhifə sayı tam ədəd olmalıdır'
    if (Object.keys(next).length) return setErrors(next)

    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      price,
      stock: form.unlimited ? null : Number(form.stock),
      year: form.year ? Number(form.year) : null,
      pages: form.pages ? Number(form.pages) : null,
      subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean),
      description: form.description.trim() || null,
    }

    setSaving(true)
    try {
      const saved = book
        ? await api<AdminBook>(`/admin/books/${book.id}`, { method: 'PATCH', body: payload })
        : await api<AdminBook>('/admin/books', { method: 'POST', body: payload })

      if (coverFile) {
        const fd = new FormData()
        fd.append('cover', coverFile)
        try {
          await api(`/admin/books/${saved.id}/cover`, { method: 'POST', formData: fd })
        } catch (err) {
          toast.error(`Kitab saxlandı, amma şəkil yüklənmədi: ${err instanceof ApiError ? err.message : 'xəta'}`)
          onSaved()
          return
        }
      }
      toast.success(book ? 'Kitab yeniləndi' : 'Kitab əlavə olundu')
      onSaved()
    } catch (err) {
      if (err instanceof ApiError) {
        const fields = err.fieldErrors()
        if (Object.keys(fields).length) setErrors(fields)
        else toast.error(err.message)
      } else {
        toast.error('Gözlənilməz xəta')
      }
    } finally {
      setSaving(false)
    }
  }

  const currentCover = coverPreview ?? book?.coverUrl ?? null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={book ? 'Kitabı redaktə et' : 'Yeni kitab'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Ləğv et</Button>
          <Button type="submit" form="book-form" loading={saving}>{book ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </>
      }
    >
      <form id="book-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-[140px_1fr]" noValidate>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Üz qabığı</p>
          <BookCover url={currentCover} title={form.title || 'Kitab'} className="aspect-[2/3] w-full max-w-[140px] rounded-lg" />
          <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-line px-2 py-2 text-xs font-medium text-muted hover:border-primary hover:text-primary">
            <ImagePlus size={14} /> Şəkil seç
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickCover(e.target.files?.[0])} />
          </label>
          {coverError ? <p className="mt-1 text-xs text-danger">{coverError}</p> : <p className="mt-1 text-xs text-muted">JPG/PNG/WEBP, max 2 MB</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input className="sm:col-span-2" label="Ad *" name="title" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />
          <Input className="sm:col-span-2" label="Müəllif *" name="author" value={form.author} onChange={(e) => set('author', e.target.value)} error={errors.author} />
          <Input label="Qiymət (₼) *" name="price" inputMode="decimal" value={form.price} onChange={(e) => set('price', e.target.value)} error={errors.price} />
          <div>
            <Input label="Stok" name="stock" inputMode="numeric" value={form.stock} disabled={form.unlimited} onChange={(e) => set('stock', e.target.value)} error={errors.stock} />
            <label className="mt-1.5 flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={form.unlimited} onChange={(e) => set('unlimited', e.target.checked)} className="accent-[var(--primary)]" />
              Limitsiz (e-kitab)
            </label>
          </div>
          <Input label="İl" name="year" inputMode="numeric" value={form.year} onChange={(e) => set('year', e.target.value)} error={errors.year} />
          <Input label="Səhifə sayı" name="pages" inputMode="numeric" value={form.pages} onChange={(e) => set('pages', e.target.value)} error={errors.pages} />
          <Input className="sm:col-span-2" label="Janrlar" name="subjects" value={form.subjects} onChange={(e) => set('subjects', e.target.value)} error={errors.subjects} hint="Vergüllə ayırın: fantasy, romance" />
          <Textarea className="sm:col-span-2" label="Təsvir" name="description" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} error={errors.description} />
        </div>
      </form>
    </Modal>
  )
}
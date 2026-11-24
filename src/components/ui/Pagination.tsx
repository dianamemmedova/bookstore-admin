import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

interface Props {
  page: number
  totalPages: number
  total: number
  limit: number
  onChange: (page: number) => void
}

export default function Pagination({ page, totalPages, total, limit, onChange }: Props) {
  if (total === 0) return null
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-5 py-3 sm:flex-row">
      <p className="text-sm text-muted">{total} nəticədən <span className="font-medium text-ink">{from}–{to}</span> göstərilir</p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} icon={<ChevronLeft size={14} />}>Əvvəlki</Button>
        <span className="text-sm text-muted">{page} / {Math.max(totalPages, 1)}</span>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Növbəti <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
import type { ReactNode } from 'react'
import { Card } from '../ui/Card'

interface Props {
  label: string
  value: string
  hint?: ReactNode
  icon: ReactNode
  tone?: 'primary' | 'info' | 'warning' | 'success'
}

const TONES = {
  primary: 'bg-primary-soft text-primary',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
}

export default function StatCard({ label, value, hint, icon, tone = 'primary' }: Props) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-ink">{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}>{icon}</div>
      </div>
      {hint && <p className="mt-3 text-xs text-muted">{hint}</p>}
    </Card>
  )
}
import { Loader2 } from 'lucide-react'

export default function Spinner({ label = 'Yüklənir...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
      <Loader2 size={18} className="animate-spin" />
      {label}
    </div>
  )
}

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-muted">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  )
}
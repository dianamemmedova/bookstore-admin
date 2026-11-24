import type { TextareaHTMLAttributes } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export default function Textarea({ label, error, className = '', id, ...rest }: Props) {
  const areaId = id ?? rest.name
  return (
    <div className={className}>
      {label && <label htmlFor={areaId} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>}
      <textarea
        id={areaId}
        {...rest}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          error ? 'border-danger' : 'border-line'
        }`}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
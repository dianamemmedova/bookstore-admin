import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
  right?: ReactNode
}

const Input = forwardRef<HTMLInputElement, Props>(function Input({ label, error, hint, icon, right, className = '', id, ...rest }, ref) {
  const inputId = id ?? rest.name
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          {...rest}
          className={`h-10 w-full rounded-lg border bg-surface text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 ${
            error ? 'border-danger' : 'border-line'
          } ${icon ? 'pl-10' : 'pl-3'} ${right ? 'pr-10' : 'pr-3'}`}
        />
        {right && <span className="absolute right-2 top-1/2 -translate-y-1/2">{right}</span>}
      </div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  )
})

export default Input
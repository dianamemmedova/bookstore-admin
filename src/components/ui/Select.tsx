import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option { value: string; label: string }

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: Option[]
  label?: string
}

export default function Select({ options, label, className = '', id, ...rest }: Props) {
  const selectId = id ?? rest.name
  return (
    <div className={className}>
      {label && <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>}
      <div className="relative">
        <select
          id={selectId}
          {...rest}
          className="h-10 w-full appearance-none rounded-lg border border-line bg-surface pl-3 pr-9 text-sm text-ink transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </div>
  )
}
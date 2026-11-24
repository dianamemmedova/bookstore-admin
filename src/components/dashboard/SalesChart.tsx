import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SalesDay } from '../../types/stats'
import { formatMoney } from '../../lib/format'

// "2026-11-24" → "24.11"
const shortDate = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`

interface TipProps {
  active?: boolean
  payload?: { payload: SalesDay }[]
}

function ChartTooltip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-ink">{d.date.split('-').reverse().join('.')}</p>
      <p className="mt-1 text-muted">Gəlir: <span className="font-semibold text-ink">{formatMoney(d.revenueCents)}</span></p>
      <p className="text-muted">Sifariş: <span className="font-semibold text-ink">{d.orders}</span></p>
    </div>
  )
}

export default function SalesChart({ series }: { series: SalesDay[] }) {
  const data = series.map((d) => ({ ...d, revenue: d.revenueCents / 100 }))
  // Çox gün olanda hər günün yazısı sıxışmasın
  const interval = Math.max(0, Math.ceil(data.length / 8) - 1)

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 24, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} interval={interval} tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={56} allowDecimals={false} tickFormatter={(v) => `${v} ₼`} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border)' }} />
          <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#revFill)" activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
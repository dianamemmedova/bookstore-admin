export function formatMoney(cents: number): string {
  return `${(cents / 100).toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₼`
}

export function formatDate(value: string | Date): string {
  const d = new Date(value)
  return d.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Baku' })
}

export function formatDateTime(value: string | Date): string {
  const d = new Date(value)
  return d.toLocaleString('az-AZ', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baku',
  })
}

export function formatNumber(n: number): string {
  return n.toLocaleString('az-AZ')
}

export function initials(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-xl font-semibold text-ink">Səhifə tapılmadı</h1>
      <p className="mt-1 text-sm text-muted">Axtardığın səhifə mövcud deyil.</p>
      <Link to="/" className="mt-6"><Button>Dashboard-a qayıt</Button></Link>
    </div>
  )
}
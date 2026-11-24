import { LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'

export default function DashboardPage() {
  const { user } = useAuth()
  return (
    <>
      <PageHeader title={`Xoş gəldin, ${user?.firstName}!`} description="Mağazanın ümumi vəziyyəti burada görünəcək." />
      <Card>
        <EmptyState
          icon={<LayoutDashboard size={22} />}
          title="Admin panel hazırdır"
          description="Giriş, menyu və tema işləyir. Növbəti addımda dashboard statistikası burada görünəcək."
        />
      </Card>
    </>
  )
}
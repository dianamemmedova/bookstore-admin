import { Construction } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <EmptyState icon={<Construction size={22} />} title="Tezliklə" description="Bu bölmə növbəti addımlarda hazırlanacaq." />
      </Card>
    </>
  )
}
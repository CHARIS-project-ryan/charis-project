import { ClipboardList } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useDonations } from '@/hooks/useQueries'
import {
  donorUserFromDonation,
  formatCurrency,
  formatName,
  relationName,
} from '@/lib/format'

export function DonationsPage() {
  const { data, isLoading } = useDonations()

  if (!isLoading && (data?.data.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No donations"
        description="Donations will appear here once recorded."
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Donations"
        description="All donations across member organisations"
      />
      <DataTable
        isLoading={isLoading}
        data={data?.data ?? []}
        columns={[
          {
            key: 'donor',
            header: 'Donor',
            cell: (r) =>
              r.is_anonymous
                ? 'Anonymous'
                : formatName(donorUserFromDonation(r)),
          },
          {
            key: 'org',
            header: 'Organisation',
            cell: (r) => relationName(r.organisations) ?? '—',
          },
          {
            key: 'campaign',
            header: 'Campaign',
            cell: (r) => r.campaigns?.title ?? 'General',
          },
          {
            key: 'amount',
            header: 'Amount',
            cell: (r) => formatCurrency(r.amount, r.currency),
          },
          {
            key: 'status',
            header: 'Status',
            cell: (r) => <StatusBadge status={r.payment_status} />,
          },
          {
            key: 'date',
            header: 'Date',
            cell: (r) =>
              r.donated_at
                ? new Date(r.donated_at).toLocaleDateString()
                : '—',
          },
        ]}
      />
    </div>
  )
}

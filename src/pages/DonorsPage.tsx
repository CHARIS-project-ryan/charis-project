import { Link, useParams } from '@tanstack/react-router'
import { Wallet } from 'lucide-react'
import { useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/SearchInput'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDonor, useDonorDonations, useDonors } from '@/hooks/useQueries'
import { OrgNameList } from '@/components/ui/OrgNameList'
import { formatCurrency, formatName, relationName } from '@/lib/format'

export function DonorsPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useDonors({ search: search || undefined })

  if (!isLoading && (data?.data.length ?? 0) === 0 && !search) {
    return (
      <EmptyState
        icon={Wallet}
        title="No donors"
        description="Registered donors will appear here."
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Donors"
        description="Donor directory — organisations reflect completed gifts"
        actions={<SearchInput placeholder="Search donors…" onChange={setSearch} />}
      />
      <DataTable
        isLoading={isLoading}
        data={data?.data ?? []}
        columns={[
          {
            key: 'name',
            header: 'Name',
            cell: (r) => (
              <Link
                to="/dashboard/donors/$id"
                params={{ id: r.id }}
                className="font-medium hover:underline"
              >
                {formatName(r.users)}
              </Link>
            ),
          },
          {
            key: 'total',
            header: 'Lifetime value',
            cell: (r) => formatCurrency(r.total_donated),
          },
          {
            key: 'count',
            header: 'Donations',
            cell: (r) => r.donation_count,
          },
        ]}
      />
    </div>
  )
}

export function DonorDetailPage() {
  const { id } = useParams({ from: '/dashboard/donors/$id' })
  const { data: donor, isLoading } = useDonor(id)
  const { data: donations } = useDonorDonations(id)

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (!donor) return <p className="text-destructive">Donor not found.</p>

  return (
    <div className="space-y-6">
      <PageHeader title={formatName(donor.users)} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Total donated: </span>
            {formatCurrency(donor.total_donated)}
          </p>
          <p>
            <span className="text-muted-foreground">Donations: </span>
            {donor.donation_count}
          </p>
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">Gives to: </span>
            <OrgNameList names={donor.organisation_names} emptyLabel="None" />
          </p>
        </CardContent>
      </Card>
      <div>
        <h3 className="mb-3 font-medium">Donation history</h3>
        <DataTable
          data={donations ?? []}
          emptyMessage="No donations yet."
          columns={[
            {
              key: 'amount',
              header: 'Amount',
              cell: (r) => formatCurrency(r.amount, r.currency),
            },
            {
              key: 'org',
              header: 'Organisation',
              cell: (r) => {
                const rel = r.organisations as
                  | { id: string; name: string }
                  | { id: string; name: string }[]
                  | null
                const org = relationName(rel)
                const orgId = Array.isArray(rel) ? rel[0]?.id : rel?.id
                return org && orgId ? (
                  <Link
                    to="/dashboard/organisations/$id"
                    params={{ id: orgId }}
                    search={{ tab: 'overview' }}
                    className="hover:underline"
                  >
                    {org}
                  </Link>
                ) : (
                  '—'
                )
              },
            },
            {
              key: 'campaign',
              header: 'Campaign',
              cell: (r) => r.campaigns?.title ?? 'General',
            },
            {
              key: 'status',
              header: 'Status',
              cell: (r) => <StatusBadge status={r.payment_status} />,
            },
            {
              key: 'receipt',
              header: 'Receipt',
              cell: (r) => r.tax_receipt_number ?? '—',
            },
          ]}
        />
      </div>
    </div>
  )
}

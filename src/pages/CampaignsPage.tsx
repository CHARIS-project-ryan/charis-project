import { Link, useParams } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/SearchInput'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useCampaign,
  useCampaignDonations,
  useCampaigns,
} from '@/hooks/useQueries'
import { formatCurrency } from '@/lib/format'

export function CampaignsPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useCampaigns({ search: search || undefined })

  if (!isLoading && (data?.data.length ?? 0) === 0 && !search) {
    return (
      <EmptyState
        icon={Heart}
        title="No campaigns"
        description="Fundraising campaigns will appear here."
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Fundraising campaigns across member organisations"
        actions={<SearchInput placeholder="Search campaigns…" onChange={setSearch} />}
      />
      <DataTable
        isLoading={isLoading}
        data={data?.data ?? []}
        columns={[
          {
            key: 'title',
            header: 'Campaign',
            cell: (r) => (
              <Link
                to="/dashboard/campaigns/$id"
                params={{ id: r.id }}
                className="font-medium hover:underline"
              >
                {r.title}
              </Link>
            ),
          },
          {
            key: 'org',
            header: 'Organisation',
            cell: (r) => r.organisations?.name ?? '—',
          },
          {
            key: 'progress',
            header: 'Progress',
            cell: (r) =>
              `${formatCurrency(r.current_amount)} / ${formatCurrency(r.goal_amount)}`,
          },
          {
            key: 'status',
            header: 'Status',
            cell: (r) => (r.is_active ? 'Active' : 'Inactive'),
          },
        ]}
      />
    </div>
  )
}

export function CampaignDetailPage() {
  const { id } = useParams({ from: '/dashboard/campaigns/$id' })
  const { data: campaign, isLoading } = useCampaign(id)
  const { data: donations } = useCampaignDonations(id)

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (!campaign) return <p className="text-destructive">Campaign not found.</p>

  const percent = Math.round(
    (Number(campaign.current_amount) / Number(campaign.goal_amount)) * 100,
  )

  return (
    <div className="space-y-6">
      <PageHeader title={campaign.title} description={campaign.short_description ?? undefined} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex justify-between text-sm">
            <span>
              {formatCurrency(campaign.current_amount)} raised of{' '}
              {formatCurrency(campaign.goal_amount)}
            </span>
            <span className="font-medium">{percent}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted">
            <div
              className="h-3 rounded-full bg-primary"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>
      <div>
        <h3 className="mb-3 font-medium">Donations</h3>
        <DataTable
          data={donations ?? []}
          emptyMessage="No donations for this campaign yet."
          columns={[
            {
              key: 'amount',
              header: 'Amount',
              cell: (r) => formatCurrency(r.amount, r.currency),
            },
            {
              key: 'status',
              header: 'Status',
              cell: (r) => r.payment_status,
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
    </div>
  )
}

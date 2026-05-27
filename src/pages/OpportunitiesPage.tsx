import { Link, useParams } from '@tanstack/react-router'
import { HandHeart } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useOpportunities,
  useOpportunity,
  useOpportunityRoster,
  useUpdateAssignmentStatus,
} from '@/hooks/useQueries'
import { formatName } from '@/lib/format'

export function OpportunitiesPage() {
  const { data, isLoading } = useOpportunities()

  if (!isLoading && (data?.data.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={HandHeart}
        title="No opportunities"
        description="Volunteer opportunities will appear here."
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Volunteer Opportunities"
        description="Browse and manage volunteer sign-ups"
      />
      <DataTable
        isLoading={isLoading}
        data={data?.data ?? []}
        columns={[
          {
            key: 'title',
            header: 'Opportunity',
            cell: (r) => (
              <Link
                to="/dashboard/opportunities/$id"
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
            key: 'location',
            header: 'Location',
            cell: (r) => r.location ?? '—',
          },
          {
            key: 'slots',
            header: 'Slots',
            cell: (r) => `${r.slots_filled}/${r.slots_total}`,
          },
          {
            key: 'date',
            header: 'Date',
            cell: (r) =>
              r.start_date
                ? new Date(r.start_date).toLocaleDateString()
                : '—',
          },
        ]}
      />
    </div>
  )
}

export function OpportunityDetailPage() {
  const { id } = useParams({ from: '/dashboard/opportunities/$id' })
  const { data: opportunity, isLoading } = useOpportunity(id)
  const { data: roster } = useOpportunityRoster(id)
  const updateStatus = useUpdateAssignmentStatus(id)

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (!opportunity)
    return <p className="text-destructive">Opportunity not found.</p>

  return (
    <div className="space-y-6">
      <PageHeader
        title={opportunity.title}
        description={opportunity.short_description ?? undefined}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Organisation: </span>
            {opportunity.organisations?.name}
          </p>
          <p>
            <span className="text-muted-foreground">Location: </span>
            {opportunity.location ?? '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Slots: </span>
            {opportunity.slots_filled}/{opportunity.slots_total}
          </p>
          <p>
            <span className="text-muted-foreground">Date: </span>
            {opportunity.start_date
              ? new Date(opportunity.start_date).toLocaleDateString()
              : '—'}
          </p>
        </CardContent>
      </Card>
      <div>
        <h3 className="mb-3 font-medium">Volunteer roster</h3>
        <DataTable
          data={roster ?? []}
          emptyMessage="No volunteers signed up yet."
          columns={[
            {
              key: 'name',
              header: 'Volunteer',
              cell: (r) => formatName(r.volunteers?.users),
            },
            {
              key: 'status',
              header: 'Status',
              cell: (r) => (
                <StatusBadge status={r.status} type="assignment" />
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              cell: (r) =>
                r.status === 'pending' ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateStatus.isPending}
                      onClick={() =>
                        updateStatus.mutate(
                          { id: r.id, status: 'confirmed' },
                          { onSuccess: () => toast.success('Volunteer confirmed') },
                        )
                      }
                    >
                      Confirm
                    </Button>
                  </div>
                ) : r.status === 'confirmed' ? (
                  <Button
                    size="sm"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate(
                        { id: r.id, status: 'completed', hoursServed: 4 },
                        { onSuccess: () => toast.success('Marked complete') },
                      )
                    }
                  >
                    Complete
                  </Button>
                ) : null,
            },
          ]}
        />
      </div>
    </div>
  )
}

import { useNavigate } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { drillMetricToOrgTab } from '@/lib/organisationTabs'
import { formatCurrency } from '@/lib/format'
import { useDonorBreakdown, useOrganisationBreakdown } from '@/hooks/useQueries'
import type { DashboardDrillMetric } from '@/types/entities'

const monthLabel = new Date().toLocaleString('default', {
  month: 'long',
  year: 'numeric',
})

const METRIC_COPY: Record<
  DashboardDrillMetric,
  { title: string; description: string }
> = {
  organisations: {
    title: 'By organisation',
    description:
      'Select an organisation to view campaigns, donations, donors, volunteers, and opportunities.',
  },
  volunteers: {
    title: 'Volunteers by organisation',
    description:
      'Select an organisation to see members who joined (explicit membership) and their activity.',
  },
  donors: {
    title: 'Donors',
    description:
      'Select an organisation or donor for full details and giving history.',
  },
  donations: {
    title: 'Donations this month',
    description: `${monthLabel} giving — open an organisation or donor for details.`,
  },
  opportunities: {
    title: 'Open opportunities by organisation',
    description: 'Select an organisation to browse volunteer opportunities.',
  },
  applications: {
    title: 'Pending applications by organisation',
    description: 'Select an organisation to review pending volunteer applications.',
  },
}

interface DashboardDrillDownProps {
  metric: DashboardDrillMetric | null
  onClose: () => void
}

export function DashboardDrillDown({ metric, onClose }: DashboardDrillDownProps) {
  const navigate = useNavigate()
  const open = metric !== null
  const { data: orgRows, isLoading: orgLoading } = useOrganisationBreakdown(open)
  const { data: donorRows, isLoading: donorLoading } = useDonorBreakdown(open)

  const copy = metric ? METRIC_COPY[metric] : null

  const goToOrganisation = (organisationId: string) => {
    if (!metric) return
    onClose()
    navigate({
      to: '/dashboard/organisations/$id',
      params: { id: organisationId },
      search: { tab: drillMetricToOrgTab(metric) },
    })
  }

  const goToDonor = (donorId: string) => {
    onClose()
    navigate({
      to: '/dashboard/donors/$id',
      params: { id: donorId },
    })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {copy && (
          <>
            <SheetHeader>
              <SheetTitle>{copy.title}</SheetTitle>
              <SheetDescription>{copy.description}</SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-4 pb-6">
              {(metric === 'organisations' ||
                metric === 'volunteers' ||
                metric === 'opportunities' ||
                metric === 'applications' ||
                metric === 'donors' ||
                metric === 'donations') && (
                <OrgPicker
                  rows={orgRows ?? []}
                  loading={orgLoading}
                  metric={metric}
                  onSelect={goToOrganisation}
                  filterDonationsThisMonth={metric === 'donations'}
                />
              )}

              {(metric === 'donors' || metric === 'donations') && (
                <DonorPicker
                  rows={donorRows ?? []}
                  loading={donorLoading}
                  thisMonthOnly={metric === 'donations'}
                  onSelectDonor={goToDonor}
                  onSelectOrg={goToOrganisation}
                />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function OrgPicker({
  rows,
  loading,
  metric,
  onSelect,
  filterDonationsThisMonth,
}: {
  rows: import('@/types/entities').OrganisationBreakdownRow[]
  loading: boolean
  metric: DashboardDrillMetric
  onSelect: (id: string) => void
  filterDonationsThisMonth?: boolean
}) {
  const filtered = filterDonationsThisMonth
    ? rows.filter((r) => r.donationsThisMonth > 0)
    : rows

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No organisation data yet.</p>
    )
  }

  return (
    <div>
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Organisations
      </h4>
      <ul className="divide-y rounded-lg border">
        {filtered.map((r) => (
          <li key={r.organisationId}>
            <button
              type="button"
              onClick={() => onSelect(r.organisationId)}
              className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="font-medium">{r.organisationName}</p>
                <p className="text-xs text-muted-foreground">
                  {metric === 'volunteers' && `${r.volunteers} volunteers`}
                  {metric === 'donors' && `${r.donors} donors`}
                  {metric === 'donations' &&
                    `${formatCurrency(r.donationsThisMonth)} this month`}
                  {metric === 'opportunities' &&
                    `${r.openOpportunities} open opportunities`}
                  {metric === 'applications' &&
                    `${r.pendingApplications} pending`}
                  {metric === 'organisations' && (
                    <>
                      {r.campaigns} campaigns · {r.donors} donors ·{' '}
                      {formatCurrency(r.totalDonations)} raised
                    </>
                  )}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DonorPicker({
  rows,
  loading,
  thisMonthOnly,
  onSelectDonor,
  onSelectOrg,
}: {
  rows: import('@/types/entities').DonorBreakdownRow[]
  loading: boolean
  thisMonthOnly: boolean
  onSelectDonor: (id: string) => void
  onSelectOrg: (id: string) => void
}) {
  const filtered = thisMonthOnly
    ? rows.filter((r) => r.donationsThisMonth > 0)
    : rows

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No donor data for this period.</p>
    )
  }

  return (
    <div>
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {thisMonthOnly ? 'Donors (this month)' : 'Donors'}
      </h4>
      <ul className="divide-y rounded-lg border">
        {filtered.map((d) => (
          <li key={d.donorId} className="px-3 py-3">
            <button
              type="button"
              onClick={() => onSelectDonor(d.donorId)}
              className="group flex w-full items-center justify-between gap-2 text-left"
            >
              <div>
                <p className="font-medium group-hover:underline">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.email}</p>
              </div>
              <span className="text-sm font-semibold">
                {formatCurrency(
                  thisMonthOnly ? d.donationsThisMonth : d.totalDonated,
                )}
              </span>
            </button>
            <ul className="mt-2 space-y-1 border-l-2 border-primary/20 pl-3">
              {d.byOrganisation.map((o) => (
                <li key={o.organisationId}>
                  <button
                    type="button"
                    onClick={() => onSelectOrg(o.organisationId)}
                    className="flex w-full justify-between text-xs text-muted-foreground hover:text-foreground"
                  >
                    <span className="hover:underline">{o.organisationName}</span>
                    <span>
                      {formatCurrency(o.amount)}
                      {o.count > 1 ? ` (${o.count})` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

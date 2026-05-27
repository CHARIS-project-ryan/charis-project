import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useMemo } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ORGANISATION_TABS } from '@/lib/organisationTabs'
import {
  donorUserFromDonation,
  formatCurrency,
  formatName,
} from '@/lib/format'
import {
  useCampaigns,
  useDonations,
  useOpportunities,
  useOrganisation,
  useOrganisationAssignments,
  useOrganisationBreakdown,
  useOrganisationDonors,
  useOrganisationVolunteerMembers,
} from '@/hooks/useQueries'
import type { OrganisationDetailTab } from '@/types/entities'
import {
  Building2,
  HandHeart,
  Heart,
  Users,
  Wallet,
} from 'lucide-react'

export function OrganisationDetailPage() {
  const { id } = useParams({ from: '/dashboard/organisations/$id' })
  const { tab = 'overview' } = useSearch({
    from: '/dashboard/organisations/$id',
  })
  const navigate = useNavigate()
  const activeTab = tab as OrganisationDetailTab

  const { data: org, isLoading: orgLoading } = useOrganisation(id)
  const { data: breakdown } = useOrganisationBreakdown()
  const summary = useMemo(
    () => breakdown?.find((r) => r.organisationId === id),
    [breakdown, id],
  )

  const { data: campaigns } = useCampaigns({
    organisation_id: id,
    per_page: 50,
  })
  const { data: donations } = useDonations({
    organisation_id: id,
    per_page: 50,
  })
  const { data: donors } = useOrganisationDonors(id)
  const { data: opportunities } = useOpportunities({
    organisation_id: id,
    per_page: 50,
  })
  const { data: volunteers } = useOrganisationVolunteerMembers(id)
  const { data: pendingAssignments } = useOrganisationAssignments(
    id,
    'pending',
  )

  if (orgLoading) {
    return <p className="text-muted-foreground">Loading organisation…</p>
  }
  if (!org) {
    return <p className="text-destructive">Organisation not found.</p>
  }

  const setTab = (next: OrganisationDetailTab) => {
    navigate({
      to: '/dashboard/organisations/$id',
      params: { id },
      search: { tab: next },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link
          to="/dashboard"
          className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <PageHeader
            title={org.name}
            description={org.description ?? org.contact_email ?? undefined}
          />
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total raised"
            value={formatCurrency(summary.totalDonations)}
            icon={Heart}
          />
          <StatCard
            title="This month"
            value={formatCurrency(summary.donationsThisMonth)}
            icon={Heart}
          />
          <StatCard title="Donors" value={summary.donors} icon={Wallet} />
          <StatCard title="Volunteers" value={summary.volunteers} icon={Users} />
          <StatCard
            title="Campaigns"
            value={summary.campaigns}
            icon={Building2}
          />
          <StatCard
            title="Open opportunities"
            value={summary.openOpportunities}
            icon={HandHeart}
          />
        </div>
      )}

      <nav className="flex flex-wrap gap-2 border-b pb-2">
        {ORGANISATION_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {t.label}
            {t.id === 'applications' &&
              (pendingAssignments?.length ?? 0) > 0 && (
                <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 text-xs">
                  {pendingAssignments?.length}
                </span>
              )}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Slug: </span>
              {org.slug}
            </p>
            <p>
              <span className="text-muted-foreground">Contact: </span>
              {org.contact_email ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Phone: </span>
              {org.contact_phone ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Website: </span>
              {org.website_url ? (
                <a
                  href={org.website_url}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {org.website_url}
                </a>
              ) : (
                '—'
              )}
            </p>
            <p className="sm:col-span-2">
              <span className="text-muted-foreground">Status: </span>
              {org.is_active ? 'Active' : 'Inactive'}
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'campaigns' && (
        <DataTable
          data={campaigns?.data ?? []}
          emptyMessage="No campaigns for this organisation."
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
      )}

      {activeTab === 'donations' && (
        <DataTable
          data={donations?.data ?? []}
          emptyMessage="No donations for this organisation."
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
              key: 'amount',
              header: 'Amount',
              cell: (r) => formatCurrency(r.amount, r.currency),
            },
            {
              key: 'campaign',
              header: 'Campaign',
              cell: (r) => r.campaigns?.title ?? '—',
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
      )}

      {activeTab === 'donors' && (
        <DataTable
          data={donors ?? []}
          emptyMessage="No donors for this organisation yet."
          columns={[
            {
              key: 'name',
              header: 'Donor',
              cell: (r) => (
                <Link
                  to="/dashboard/donors/$id"
                  params={{ id: r.donorId }}
                  className="font-medium hover:underline"
                >
                  {r.name}
                </Link>
              ),
            },
            { key: 'email', header: 'Email', cell: (r) => r.email },
            {
              key: 'total',
              header: 'Given to org',
              cell: (r) => formatCurrency(r.totalAtOrg),
            },
            {
              key: 'count',
              header: 'Gifts',
              cell: (r) => r.donationCount,
            },
          ]}
        />
      )}

      {activeTab === 'volunteers' && (
        <DataTable
          data={volunteers ?? []}
          emptyMessage="No volunteers have joined this organisation yet."
          columns={[
            {
              key: 'name',
              header: 'Volunteer',
              cell: (r) => (
                <Link
                  to="/dashboard/volunteers/$id"
                  params={{ id: r.volunteerId }}
                  className="font-medium hover:underline"
                >
                  {r.name}
                </Link>
              ),
            },
            { key: 'email', header: 'Email', cell: (r) => r.email },
            {
              key: 'joined',
              header: 'Joined',
              cell: (r) =>
                r.joinedAt
                  ? new Date(r.joinedAt).toLocaleDateString()
                  : '—',
            },
            {
              key: 'hours',
              header: 'Hours at org',
              cell: (r) => r.hoursAtOrg.toFixed(1),
            },
            {
              key: 'assignments',
              header: 'Assignments',
              cell: (r) => r.assignmentCount,
            },
          ]}
        />
      )}

      {activeTab === 'opportunities' && (
        <DataTable
          data={opportunities?.data ?? []}
          emptyMessage="No volunteer opportunities."
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
            {
              key: 'status',
              header: 'Status',
              cell: (r) => (r.is_active ? 'Open' : 'Closed'),
            },
          ]}
        />
      )}

      {activeTab === 'applications' && (
        <DataTable
          data={pendingAssignments ?? []}
          emptyMessage="No pending applications."
          columns={[
            {
              key: 'volunteer',
              header: 'Volunteer',
              cell: (r) => {
                const vol = r.volunteers as {
                  id: string
                  users?: {
                    first_name: string
                    last_name: string
                    email: string
                  }
                } | null
                if (!vol) return '—'
                return (
                  <Link
                    to="/dashboard/volunteers/$id"
                    params={{ id: vol.id }}
                    className="font-medium hover:underline"
                  >
                    {formatName(vol.users)}
                  </Link>
                )
              },
            },
            {
              key: 'opportunity',
              header: 'Opportunity',
              cell: (r) => {
                const opp = r.volunteer_opportunities as {
                  title: string
                } | null
                return opp?.title ?? '—'
              },
            },
            {
              key: 'status',
              header: 'Status',
              cell: (r) => <StatusBadge status={r.status} />,
            },
            {
              key: 'applied',
              header: 'Applied',
              cell: (r) =>
                r.applied_at
                  ? new Date(r.applied_at).toLocaleDateString()
                  : '—',
            },
          ]}
        />
      )}
    </div>
  )
}

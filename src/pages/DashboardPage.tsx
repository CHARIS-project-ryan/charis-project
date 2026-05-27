import { Link } from '@tanstack/react-router'
import {
  Building2,
  HandHeart,
  Heart,
  Users,
  Wallet,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import {
  useDashboardStats,
  useDonations,
  useMonthlyDonations,
  useOpportunities,
  useTopCampaigns,
} from '@/hooks/useQueries'
import { formatCurrency } from '@/lib/format'

export function DashboardPage() {
  const { isSuperAdmin, isOrgAdmin } = useAuth()
  const { data: stats, isLoading } = useDashboardStats()
  const { data: monthly } = useMonthlyDonations()
  const { data: topCampaigns } = useTopCampaigns()
  const { data: recentDonations } = useDonations({ per_page: 5 })
  const { data: upcoming } = useOpportunities({ is_active: true, per_page: 5 })

  if (isLoading || !stats) {
    return <p className="text-muted-foreground">Loading dashboard…</p>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          isSuperAdmin
            ? 'CHARIS-wide overview'
            : isOrgAdmin
              ? 'Your organisation at a glance'
              : 'Welcome back'
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isSuperAdmin && (
          <StatCard
            title="Organisations"
            value={stats.organisations}
            icon={Building2}
          />
        )}
        <StatCard title="Volunteers" value={stats.volunteers} icon={Users} />
        <StatCard title="Donors" value={stats.donors} icon={Wallet} />
        <StatCard
          title="Donations this month"
          value={formatCurrency(stats.donationsThisMonth)}
          icon={Heart}
        />
        {(isOrgAdmin || isSuperAdmin) && (
          <>
            <StatCard
              title="Open opportunities"
              value={stats.openOpportunities}
              icon={HandHeart}
            />
            <StatCard
              title="Pending applications"
              value={stats.pendingApplications}
              icon={Users}
            />
          </>
        )}
      </div>

      {isSuperAdmin && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly donations</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top campaigns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(topCampaigns ?? []).map((c) => (
                <div key={c.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <Link
                      to="/dashboard/campaigns/$id"
                      params={{ id: c.id }}
                      className="font-medium hover:underline"
                    >
                      {c.title}
                    </Link>
                    <span className="text-muted-foreground">{c.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.min(c.percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {(topCampaigns ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No campaigns yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-medium">Recent donations</h3>
          <DataTable
            data={recentDonations?.data ?? []}
            columns={[
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
            emptyMessage="No donations yet."
          />
        </div>

        {(isOrgAdmin || isSuperAdmin) && (
          <div>
            <h3 className="mb-3 text-sm font-medium">Upcoming opportunities</h3>
            <DataTable
              data={upcoming?.data ?? []}
              columns={[
                {
                  key: 'title',
                  header: 'Title',
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
              ]}
              emptyMessage="No upcoming opportunities."
            />
          </div>
        )}
      </div>
    </div>
  )
}

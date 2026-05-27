import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Building2,
  HandHeart,
  Heart,
  Users,
  Wallet,
} from 'lucide-react'
import { DashboardDrillDown } from '@/components/dashboard/DashboardDrillDown'
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
import { debugLog, debugWarn } from '@/lib/debug'
import { formatCurrency, relationName } from '@/lib/format'
import type { DashboardDrillMetric } from '@/types/entities'

const DRILL_HINT = 'Click for breakdown'

export function DashboardPage() {
  const [drillMetric, setDrillMetric] = useState<DashboardDrillMetric | null>(
    null,
  )
  const { isSuperAdmin, isOrgAdmin, role, session, isLoading: authLoading } =
    useAuth()
  const queriesEnabled = !authLoading && !!session && !!role

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsFailed,
    error: statsError,
  } = useDashboardStats({ enabled: queriesEnabled })
  const { data: monthly, error: monthlyError } = useMonthlyDonations({
    enabled: queriesEnabled,
  })
  const { data: topCampaigns } = useTopCampaigns({ enabled: queriesEnabled })
  const {
    data: recentDonations,
    error: donationsError,
    isError: donationsFailed,
  } = useDonations({ per_page: 8 }, { enabled: queriesEnabled })
  const { data: upcoming } = useOpportunities(
    { is_active: true, per_page: 5 },
    { enabled: queriesEnabled },
  )

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  useEffect(() => {
    debugLog('DashboardPage', 'render state', {
      authLoading,
      queriesEnabled,
      statsLoading,
      statsFailed,
      stats: stats ?? null,
      statsError: statsError?.message ?? null,
      role,
      email: session?.user?.email ?? null,
      isSuperAdmin,
      monthlyPoints: monthly?.length ?? 0,
      monthlyError: monthlyError?.message ?? null,
      recentCount: recentDonations?.data?.length ?? 0,
      donationsError: donationsError?.message ?? null,
      topCampaignsCount: topCampaigns?.length ?? 0,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
    })
  }, [
    authLoading,
    queriesEnabled,
    statsLoading,
    statsFailed,
    stats,
    statsError,
    role,
    session,
    isSuperAdmin,
    monthly,
    monthlyError,
    recentDonations,
    donationsError,
    topCampaigns,
    supabaseUrl,
    supabaseKey,
  ])

  if (!supabaseUrl || !supabaseKey) {
    debugWarn('DashboardPage', 'missing env vars')
    return (
      <p className="text-destructive">
        Missing Supabase env vars. Set VITE_SUPABASE_URL and
        VITE_SUPABASE_ANON_KEY (Vercel → Project Settings → Environment
        Variables), then redeploy.
      </p>
    )
  }

  if (authLoading || statsLoading) {
    return <p className="text-muted-foreground">Loading dashboard…</p>
  }

  if (statsFailed || !stats) {
    return (
      <div className="space-y-2">
        <p className="text-destructive">
          Could not load dashboard: {statsError?.message ?? 'Unknown error'}
        </p>
        <p className="text-sm text-muted-foreground">
          Signed in as {session?.user.email ?? 'unknown'} (role:{' '}
          {role ?? 'not set'}). Run fix-rls-recursion.sql and
          seed-donations-fix.sql in Supabase, then sign out and back in.
        </p>
      </div>
    )
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
            description={DRILL_HINT}
            onClick={() => setDrillMetric('organisations')}
          />
        )}
        <StatCard
          title="Volunteers"
          value={stats.volunteers}
          icon={Users}
          description={DRILL_HINT}
          onClick={() => setDrillMetric('volunteers')}
        />
        <StatCard
          title="Donors"
          value={stats.donors}
          icon={Wallet}
          description={DRILL_HINT}
          onClick={() => setDrillMetric('donors')}
        />
        <StatCard
          title="Donations this month"
          value={formatCurrency(stats.donationsThisMonth)}
          icon={Heart}
          description={DRILL_HINT}
          onClick={() => setDrillMetric('donations')}
        />
        {(isOrgAdmin || isSuperAdmin) && (
          <>
            <StatCard
              title="Open opportunities"
              value={stats.openOpportunities}
              icon={HandHeart}
              description={DRILL_HINT}
              onClick={() => setDrillMetric('opportunities')}
            />
            <StatCard
              title="Pending applications"
              value={stats.pendingApplications}
              icon={Users}
              description={DRILL_HINT}
              onClick={() => setDrillMetric('applications')}
            />
          </>
        )}
      </div>

      <DashboardDrillDown
        metric={drillMetric}
        onClose={() => setDrillMetric(null)}
      />

      {isSuperAdmin && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly donations</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {monthlyError && (
                <p className="mb-2 text-sm text-destructive">
                  Could not load donations: {monthlyError.message}
                </p>
              )}
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
              {(topCampaigns ?? []).map((c) => {
                const orgName = relationName(c.organisations)
                return (
                <div key={c.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <div className="min-w-0">
                      <Link
                        to="/dashboard/campaigns/$id"
                        params={{ id: c.id }}
                        className="font-medium hover:underline"
                      >
                        {c.title}
                      </Link>
                      {orgName && (
                        <p className="truncate text-xs text-muted-foreground">
                          {orgName}
                        </p>
                      )}
                    </div>
                    <span className="text-muted-foreground">{c.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.min(c.percent, 100)}%` }}
                    />
                  </div>
                </div>
              )})}
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
          {donationsFailed && (
            <p className="mb-2 text-sm text-destructive">
              Could not load donations: {donationsError?.message}
            </p>
          )}
          {!donationsFailed &&
            (recentDonations?.data ?? []).length === 0 &&
            isSuperAdmin && (
              <p className="mb-2 text-sm text-muted-foreground">
                No donation rows in the database. Run{' '}
                <code className="text-xs">supabase/seed-donations-fix.sql</code>{' '}
                in the Supabase SQL Editor (after auth + org seed).
              </p>
            )}
          <DataTable
            data={recentDonations?.data ?? []}
            columns={[
              {
                key: 'campaign',
                header: 'Campaign',
                cell: (r) => r.campaigns?.title ?? '—',
              },
              {
                key: 'org',
                header: 'Organisation',
                cell: (r) => relationName(r.organisations) ?? '—',
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

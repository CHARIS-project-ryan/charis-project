import { Link, useParams } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/SearchInput'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import {
  useVolunteer,
  useVolunteerAssignments,
  useVolunteers,
} from '@/hooks/useQueries'
import { OrgNameList } from '@/components/ui/OrgNameList'
import { formatName, relationName } from '@/lib/format'

export function VolunteersPage() {
  const [search, setSearch] = useState('')
  const { isSuperAdmin, isOrgAdmin, orgIds } = useAuth()
  const { data, isLoading } = useVolunteers({
    search: search || undefined,
    organisation_ids:
      isOrgAdmin && !isSuperAdmin && orgIds.length > 0 ? orgIds : undefined,
  })

  if (!isLoading && (data?.data.length ?? 0) === 0 && !search) {
    return (
      <EmptyState
        icon={Users}
        title="No volunteers"
        description="Registered volunteers will appear here."
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Volunteers"
        description={
          isOrgAdmin && !isSuperAdmin
            ? 'Volunteers who have joined your organisation(s)'
            : 'All volunteers with org membership'
        }
        actions={<SearchInput placeholder="Search volunteers…" onChange={setSearch} />}
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
                to="/dashboard/volunteers/$id"
                params={{ id: r.id }}
                className="font-medium hover:underline"
              >
                {formatName(r.users)}
              </Link>
            ),
          },
          {
            key: 'orgs',
            header: 'Organisations',
            cell: (r) => <OrgNameList names={r.organisation_names} />,
          },
          {
            key: 'email',
            header: 'Email',
            cell: (r) => r.users?.email ?? '—',
          },
          {
            key: 'hours',
            header: 'Hours served',
            cell: (r) => Number(r.total_hours_served).toFixed(1),
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

export function VolunteerDetailPage() {
  const { id } = useParams({ from: '/dashboard/volunteers/$id' })
  const { data: volunteer, isLoading } = useVolunteer(id)
  const { data: assignments } = useVolunteerAssignments(id)

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (!volunteer) return <p className="text-destructive">Volunteer not found.</p>

  return (
    <div className="space-y-6">
      <PageHeader title={formatName(volunteer.users)} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Email: </span>
            {volunteer.users?.email}
          </p>
          <p>
            <span className="text-muted-foreground">Phone: </span>
            {volunteer.users?.phone_number ?? '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Total hours: </span>
            {Number(volunteer.total_hours_served).toFixed(1)}
          </p>
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">Member of: </span>
            <OrgNameList names={volunteer.organisation_names} emptyLabel="None" />
          </p>
        </CardContent>
      </Card>
      <div>
        <h3 className="mb-3 font-medium">Assignment history</h3>
        <DataTable
          data={(assignments ?? []) as Array<{
            id: string
            status: string
            applied_at: string
            organisations?: { name: string } | { name: string }[]
            volunteer_opportunities?: { title: string; start_date: string | null }
          }>}
          emptyMessage="No assignments yet."
          columns={[
            {
              key: 'org',
              header: 'Organisation',
              cell: (r) =>
                relationName(
                  r.organisations as
                    | { name: string }
                    | { name: string }[]
                    | null,
                ) ?? '—',
            },
            {
              key: 'title',
              header: 'Opportunity',
              cell: (r) => r.volunteer_opportunities?.title ?? '—',
            },
            {
              key: 'status',
              header: 'Status',
              cell: (r) => (
                <StatusBadge status={r.status} type="assignment" />
              ),
            },
            {
              key: 'applied',
              header: 'Applied',
              cell: (r) => new Date(r.applied_at).toLocaleDateString(),
            },
          ]}
        />
      </div>
    </div>
  )
}

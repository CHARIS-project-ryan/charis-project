import { useNavigate } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useOrganisations } from '@/hooks/useQueries'

export function OrganisationsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useOrganisations()

  if (!isLoading && (data?.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No organisations"
        description="Member organisations will appear here once added."
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Organisations"
        description="Member organisations under CHARIS Singapore"
      />
      <DataTable
        isLoading={isLoading}
        data={data ?? []}
        onRowClick={(row) =>
          navigate({
            to: '/dashboard/organisations/$id',
            params: { id: row.id },
            search: { tab: 'overview' },
          })
        }
        columns={[
          { key: 'name', header: 'Name', cell: (r) => r.name },
          { key: 'slug', header: 'Slug', cell: (r) => r.slug },
          {
            key: 'contact',
            header: 'Contact',
            cell: (r) => r.contact_email ?? '—',
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

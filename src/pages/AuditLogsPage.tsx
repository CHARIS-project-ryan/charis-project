import { ScrollText } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuditLogs } from '@/hooks/useQueries'
import { formatName } from '@/lib/format'

export function AuditLogsPage() {
  const { data, isLoading } = useAuditLogs()

  if (!isLoading && (data?.data.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No audit logs"
        description="System activity will be recorded here."
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Who did what, and when — a read-only trail of creates, updates, exports, and sign-ins for your organisation (PDPA / accountability)."
      />
      <DataTable
        isLoading={isLoading}
        data={data?.data ?? []}
        columns={[
          {
            key: 'timestamp',
            header: 'Time',
            cell: (r) => new Date(r.timestamp).toLocaleString(),
          },
          {
            key: 'user',
            header: 'User',
            cell: (r) => formatName(r.users),
          },
          {
            key: 'action',
            header: 'Action',
            cell: (r) => r.action,
          },
          {
            key: 'table',
            header: 'Table',
            cell: (r) => r.table_name,
          },
        ]}
      />
    </div>
  )
}

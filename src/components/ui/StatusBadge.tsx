import { cn } from '@/lib/utils'
import type { AssignmentStatus, PaymentStatus, UserRole } from '@/types/entities'

const paymentColors: Record<PaymentStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-slate-100 text-slate-700',
}

const assignmentColors: Record<AssignmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-100 text-slate-700',
  no_show: 'bg-red-100 text-red-800',
}

export function StatusBadge({
  status,
  type = 'payment',
}: {
  status: string
  type?: 'payment' | 'assignment'
}) {
  const colors =
    type === 'assignment'
      ? assignmentColors[status as AssignmentStatus]
      : paymentColors[status as PaymentStatus]

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        colors ?? 'bg-muted text-muted-foreground',
      )}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

const roleColors: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  org_admin: 'bg-blue-100 text-blue-800',
  volunteer: 'bg-emerald-100 text-emerald-800',
  donor: 'bg-amber-100 text-amber-800',
}

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        roleColors[role],
      )}
    >
      {role.replace('_', ' ')}
    </span>
  )
}

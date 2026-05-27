import { Link } from '@tanstack/react-router'
import {
  Building2,
  ClipboardList,
  Heart,
  HandHeart,
  LayoutDashboard,
  ScrollText,
  Users,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const allNavItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard, end: true, superOnly: false, adminOnly: false },
  { to: '/dashboard/organisations', label: 'Organisations', icon: Building2, superOnly: true, adminOnly: false },
  { to: '/dashboard/campaigns', label: 'Campaigns', icon: Heart, superOnly: false, adminOnly: false },
  { to: '/dashboard/opportunities', label: 'Opportunities', icon: HandHeart, superOnly: false, adminOnly: false },
  { to: '/dashboard/volunteers', label: 'Volunteers', icon: Users, superOnly: false, adminOnly: true },
  { to: '/dashboard/donors', label: 'Donors', icon: Wallet, superOnly: false, adminOnly: true },
  { to: '/dashboard/donations', label: 'Donations', icon: ClipboardList, superOnly: false, adminOnly: true },
  { to: '/dashboard/audit-logs', label: 'Audit Logs', icon: ScrollText, superOnly: false, adminOnly: true },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { role, isSuperAdmin, isOrgAdmin } = useAuth()

  const navItems = allNavItems.filter((item) => {
    if (isSuperAdmin) return true
    if (isOrgAdmin) return !item.superOnly
    return !item.superOnly && !item.adminOnly
  })

  return (
    <aside
      className={cn(
        'flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
        className,
      )}
    >
      <div className="border-b border-sidebar-border px-4 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          CHARIS
        </p>
        <h1 className="text-lg font-semibold">VDMS</h1>
        {role && (
          <p className="mt-1 text-xs capitalize text-muted-foreground">
            {role.replace('_', ' ')}
          </p>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ to, label, icon: Icon, ...rest }) => (
          <Link
            key={to}
            to={to}
            {...('end' in rest ? { activeOptions: { exact: true } } : {})}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{
              className:
                'bg-sidebar-accent text-sidebar-accent-foreground font-semibold',
            }}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

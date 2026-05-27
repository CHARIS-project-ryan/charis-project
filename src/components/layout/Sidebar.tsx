import { Link, useNavigate } from '@tanstack/react-router'
import {
  Building2,
  ClipboardList,
  Heart,
  HandHeart,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Users,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { formatName } from '@/lib/format'
import { cn } from '@/lib/utils'

function formatRoleLabel(role: string) {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

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
  const navigate = useNavigate()
  const { user, role, isSuperAdmin, isOrgAdmin, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate({ to: '/login' })
  }

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
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          CHARIS
        </p>
        {user && (
          <p className="mt-2 text-sm font-semibold text-sidebar-foreground">
            {formatName(user)}
          </p>
        )}
        {role && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatRoleLabel(role)}
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
      <div className="border-t border-sidebar-border p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}

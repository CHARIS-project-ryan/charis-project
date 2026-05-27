import { Outlet, useRouterState } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/organisations': 'Organisations',
  '/dashboard/campaigns': 'Campaigns',
  '/dashboard/opportunities': 'Volunteer Opportunities',
  '/dashboard/volunteers': 'Volunteers',
  '/dashboard/donors': 'Donors',
  '/dashboard/donations': 'Donations',
  '/dashboard/audit-logs': 'Audit Logs',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]

  if (pathname.startsWith('/dashboard/organisations/')) return 'Organisation'
  if (pathname.startsWith('/dashboard/campaigns/')) return 'Campaign Details'
  if (pathname.startsWith('/dashboard/opportunities/')) return 'Opportunity Details'
  if (pathname.startsWith('/dashboard/volunteers/')) return 'Volunteer Profile'
  if (pathname.startsWith('/dashboard/donors/')) return 'Donor Profile'

  return 'Dashboard'
}

export function DashboardLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const title = getPageTitle(pathname)

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar className="hidden md:flex" />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar title={title} />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import {
  AuditLogsPage,
  CampaignDetailPage,
  CampaignsPage,
  DashboardPage,
  DonationsPage,
  DonorDetailPage,
  DonorsPage,
  OpportunitiesPage,
  OpportunityDetailPage,
  OrganisationDetailPage,
  OrganisationsPage,
  VolunteerDetailPage,
  VolunteersPage,
} from '@/pages'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardLayout,
})

const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/',
  component: DashboardPage,
})

const organisationsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'organisations',
  component: OrganisationsPage,
})

const organisationDetailRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'organisations/$id',
  component: OrganisationDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === 'string' ? search.tab : 'overview',
  }),
})

const campaignsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'campaigns',
  component: CampaignsPage,
})

const campaignDetailRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'campaigns/$id',
  component: CampaignDetailPage,
})

const opportunitiesRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'opportunities',
  component: OpportunitiesPage,
})

const opportunityDetailRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'opportunities/$id',
  component: OpportunityDetailPage,
})

const volunteersRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'volunteers',
  component: VolunteersPage,
})

const volunteerDetailRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'volunteers/$id',
  component: VolunteerDetailPage,
})

const donorsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'donors',
  component: DonorsPage,
})

const donorDetailRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'donors/$id',
  component: DonorDetailPage,
})

const donationsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'donations',
  component: DonationsPage,
})

const auditLogsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'audit-logs',
  component: AuditLogsPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  dashboardRoute.addChildren([
    dashboardIndexRoute,
    organisationsRoute,
    organisationDetailRoute,
    campaignsRoute,
    campaignDetailRoute,
    opportunitiesRoute,
    opportunityDetailRoute,
    volunteersRoute,
    volunteerDetailRoute,
    donorsRoute,
    donorDetailRoute,
    donationsRoute,
    auditLogsRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  context: {
    session: null as Awaited<
      ReturnType<typeof supabase.auth.getSession>
    >['data']['session'],
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

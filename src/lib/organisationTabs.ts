import type {
  DashboardDrillMetric,
  OrganisationDetailTab,
} from '@/types/entities'

export const ORGANISATION_TABS: {
  id: OrganisationDetailTab
  label: string
}[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'donations', label: 'Donations' },
  { id: 'donors', label: 'Donors' },
  { id: 'volunteers', label: 'Volunteers' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'applications', label: 'Applications' },
]

export function drillMetricToOrgTab(
  metric: DashboardDrillMetric,
): OrganisationDetailTab {
  const map: Record<DashboardDrillMetric, OrganisationDetailTab> = {
    organisations: 'overview',
    volunteers: 'volunteers',
    donors: 'donors',
    donations: 'donations',
    opportunities: 'opportunities',
    applications: 'applications',
  }
  return map[metric]
}

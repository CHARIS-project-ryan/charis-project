import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { debugError, debugLog } from '@/lib/debug'
import {
  getCampaign,
  getCampaignDonations,
  getCampaigns,
  type CampaignFilters,
} from '@/lib/api/campaigns'
import {
  getDonorDashboardBreakdown,
  getOrganisationDashboardBreakdown,
} from '@/lib/api/dashboard'
import {
  getDashboardStats,
  getDonation,
  getDonations,
  getDonor,
  getDonorDonations,
  getDonors,
  getMonthlyDonations,
  getTopCampaigns,
  type DonationFilters,
  type DonorFilters,
} from '@/lib/api/donations'
import { getAuditLogs, type AuditLogFilters } from '@/lib/api/audit'
import {
  getOrganisation,
  getOrganisationAssignments,
  getOrganisationDonors,
  getOrganisationVolunteerMembers,
  getOrganisations,
} from '@/lib/api/organisations'
import {
  getOpportunities,
  getOpportunity,
  getOpportunityRoster,
  getVolunteer,
  getVolunteerAssignments,
  getVolunteers,
  updateAssignmentStatus,
  type OpportunityFilters,
  type VolunteerFilters,
} from '@/lib/api/volunteers'
import { queryKeys } from '@/lib/queryKeys'

export function useOrganisations() {
  return useQuery({
    queryKey: queryKeys.organisations.all,
    queryFn: getOrganisations,
  })
}

export function useOrganisation(id: string) {
  return useQuery({
    queryKey: queryKeys.organisations.detail(id),
    queryFn: () => getOrganisation(id),
    enabled: !!id,
  })
}

export function useOrganisationDonors(id: string) {
  return useQuery({
    queryKey: queryKeys.organisations.donors(id),
    queryFn: () => getOrganisationDonors(id),
    enabled: !!id,
  })
}

export function useOrganisationVolunteerMembers(id: string) {
  return useQuery({
    queryKey: queryKeys.organisations.volunteers(id),
    queryFn: () => getOrganisationVolunteerMembers(id),
    enabled: !!id,
  })
}

export function useOrganisationAssignments(
  id: string,
  status?: 'pending' | 'confirmed' | 'completed',
) {
  return useQuery({
    queryKey: queryKeys.organisations.assignments(id, status),
    queryFn: () => getOrganisationAssignments(id, status),
    enabled: !!id,
  })
}

export function useCampaigns(filters?: CampaignFilters) {
  return useQuery({
    queryKey: queryKeys.campaigns.all(filters),
    queryFn: () => getCampaigns(filters),
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(id),
    queryFn: () => getCampaign(id),
    enabled: !!id,
  })
}

export function useCampaignDonations(id: string) {
  return useQuery({
    queryKey: queryKeys.campaigns.donations(id),
    queryFn: () => getCampaignDonations(id),
    enabled: !!id,
  })
}

export function useOpportunities(
  filters?: OpportunityFilters,
  options?: QueryEnabled,
) {
  return useQuery({
    queryKey: queryKeys.opportunities.all(filters),
    queryFn: () => getOpportunities(filters),
    enabled: options?.enabled ?? true,
  })
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: queryKeys.opportunities.detail(id),
    queryFn: () => getOpportunity(id),
    enabled: !!id,
  })
}

export function useOpportunityRoster(id: string) {
  return useQuery({
    queryKey: queryKeys.opportunities.roster(id),
    queryFn: () => getOpportunityRoster(id),
    enabled: !!id,
  })
}

export function useUpdateAssignmentStatus(opportunityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
      hoursServed,
    }: {
      id: string
      status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
      hoursServed?: number
    }) => updateAssignmentStatus(id, status, hoursServed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.opportunities.roster(opportunityId) })
    },
  })
}

export function useVolunteers(filters?: VolunteerFilters) {
  return useQuery({
    queryKey: queryKeys.volunteers.all(filters),
    queryFn: () => getVolunteers(filters),
  })
}

export function useVolunteer(id: string) {
  return useQuery({
    queryKey: queryKeys.volunteers.detail(id),
    queryFn: () => getVolunteer(id),
    enabled: !!id,
  })
}

export function useVolunteerAssignments(
  id: string,
  options?: { organisation_ids?: string[] },
) {
  return useQuery({
    queryKey: [...queryKeys.volunteers.assignments(id), options ?? {}],
    queryFn: () => getVolunteerAssignments(id, options),
    enabled: !!id,
  })
}

export function useDonors(filters?: DonorFilters) {
  return useQuery({
    queryKey: queryKeys.donors.all(filters),
    queryFn: () => getDonors(filters),
  })
}

export function useDonor(id: string) {
  return useQuery({
    queryKey: queryKeys.donors.detail(id),
    queryFn: () => getDonor(id),
    enabled: !!id,
  })
}

export function useDonorDonations(id: string) {
  return useQuery({
    queryKey: queryKeys.donors.donations(id),
    queryFn: () => getDonorDonations(id),
    enabled: !!id,
  })
}

export function useDonations(
  filters?: DonationFilters,
  options?: QueryEnabled,
) {
  const enabled = options?.enabled ?? true
  return useQuery({
    queryKey: queryKeys.donations.all(filters),
    queryFn: async () => {
      debugLog('useDonations', 'queryFn start', { filters, enabled })
      try {
        return await getDonations(filters)
      } catch (e) {
        debugError('useDonations', 'queryFn failed', e)
        throw e
      }
    },
    enabled,
  })
}

export function useDonation(id: string) {
  return useQuery({
    queryKey: queryKeys.donations.detail(id),
    queryFn: () => getDonation(id),
    enabled: !!id,
  })
}

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: queryKeys.auditLogs.all(filters),
    queryFn: () => getAuditLogs(filters),
  })
}

type QueryEnabled = { enabled?: boolean }

function useDashboardScope() {
  const { session, role } = useAuth()
  return {
    userId: session?.user?.id ?? null,
    role: role ?? null,
  }
}

export function useDashboardStats(options?: QueryEnabled) {
  const { userId, role } = useDashboardScope()
  const enabled = (options?.enabled ?? true) && !!userId && !!role
  return useQuery({
    queryKey: queryKeys.dashboard.stats(userId, role),
    queryFn: async () => {
      debugLog('useDashboardStats', 'queryFn start')
      try {
        const result = await getDashboardStats()
        debugLog('useDashboardStats', 'queryFn success', result)
        return result
      } catch (e) {
        debugError('useDashboardStats', 'queryFn failed', e)
        throw e
      }
    },
    enabled,
    meta: { enabled },
  })
}

export function useMonthlyDonations(options?: QueryEnabled) {
  const { userId, role } = useDashboardScope()
  const enabled = (options?.enabled ?? true) && !!userId && !!role
  return useQuery({
    queryKey: queryKeys.dashboard.monthlyDonations(userId, role),
    queryFn: async () => {
      debugLog('useMonthlyDonations', 'queryFn start')
      try {
        const result = await getMonthlyDonations()
        debugLog('useMonthlyDonations', 'queryFn success', {
          months: result.length,
        })
        return result
      } catch (e) {
        debugError('useMonthlyDonations', 'queryFn failed', e)
        throw e
      }
    },
    enabled,
    meta: { enabled },
  })
}

export function useTopCampaigns(options?: QueryEnabled) {
  const { userId, role } = useDashboardScope()
  const enabled = (options?.enabled ?? true) && !!userId && !!role
  return useQuery({
    queryKey: queryKeys.dashboard.topCampaigns(userId, role),
    queryFn: () => getTopCampaigns(),
    enabled,
  })
}

export function useOrganisationBreakdown(enabled = true) {
  const { userId, role } = useDashboardScope()
  return useQuery({
    queryKey: queryKeys.dashboard.orgBreakdown(userId, role),
    queryFn: getOrganisationDashboardBreakdown,
    enabled: enabled && !!userId && !!role,
  })
}

export function useDonorBreakdown(enabled = true) {
  const { userId, role } = useDashboardScope()
  return useQuery({
    queryKey: queryKeys.dashboard.donorBreakdown(userId, role),
    queryFn: getDonorDashboardBreakdown,
    enabled: enabled && !!userId && !!role,
  })
}

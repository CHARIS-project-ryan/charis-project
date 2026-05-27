import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCampaign,
  getCampaignDonations,
  getCampaigns,
  type CampaignFilters,
} from '@/lib/api/campaigns'
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

export function useOpportunities(filters?: OpportunityFilters) {
  return useQuery({
    queryKey: queryKeys.opportunities.all(filters),
    queryFn: () => getOpportunities(filters),
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

export function useVolunteerAssignments(id: string) {
  return useQuery({
    queryKey: queryKeys.volunteers.assignments(id),
    queryFn: () => getVolunteerAssignments(id),
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

export function useDonations(filters?: DonationFilters) {
  return useQuery({
    queryKey: queryKeys.donations.all(filters),
    queryFn: () => getDonations(filters),
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

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: getDashboardStats,
  })
}

export function useMonthlyDonations() {
  return useQuery({
    queryKey: queryKeys.dashboard.monthlyDonations,
    queryFn: getMonthlyDonations,
  })
}

export function useTopCampaigns() {
  return useQuery({
    queryKey: queryKeys.dashboard.topCampaigns,
    queryFn: () => getTopCampaigns(),
  })
}

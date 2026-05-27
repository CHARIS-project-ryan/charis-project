import { supabase } from '@/lib/supabase'
import type {
  PaginationParams,
  Volunteer,
  VolunteerAssignment,
  VolunteerOpportunity,
} from '@/types/entities'
import { volunteerOrganisationNamesByUserId } from '@/lib/organisationNames'
import { createAuditLog } from './audit'

export interface OpportunityFilters extends PaginationParams {
  organisation_id?: string
  is_active?: boolean
}

export async function getOpportunities(filters: OpportunityFilters = {}) {
  const page = filters.page ?? 1
  const perPage = filters.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('volunteer_opportunities')
    .select('*, organisations(name)', { count: 'exact' })
    .order('start_date', { ascending: true })
    .range(from, to)

  if (filters.organisation_id)
    query = query.eq('organisation_id', filters.organisation_id)
  if (filters.is_active !== undefined)
    query = query.eq('is_active', filters.is_active)

  const { data, error, count } = await query
  if (error) throw error
  return { data: (data ?? []) as VolunteerOpportunity[], count: count ?? 0 }
}

export async function getOpportunity(id: string) {
  const { data, error } = await supabase
    .from('volunteer_opportunities')
    .select('*, organisations(name)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as VolunteerOpportunity
}

export async function getOpportunityRoster(id: string) {
  const { data, error } = await supabase
    .from('volunteer_assignments')
    .select('*, volunteers(*, users(first_name, last_name, email))')
    .eq('opportunity_id', id)
    .order('applied_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as VolunteerAssignment[]
}

export async function updateAssignmentStatus(
  id: string,
  status: VolunteerAssignment['status'],
  hoursServed?: number,
) {
  const updates: Record<string, unknown> = { status }
  if (status === 'confirmed') updates.confirmed_at = new Date().toISOString()
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
    if (hoursServed !== undefined) updates.hours_served = hoursServed
  }

  const { data, error } = await supabase
    .from('volunteer_assignments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  await createAuditLog({
    action: 'update',
    table_name: 'volunteer_assignments',
    record_id: id,
    organisation_id: data.organisation_id,
    changes: updates,
  })
  return data as VolunteerAssignment
}

export interface VolunteerFilters extends PaginationParams {
  /** Volunteers with member membership at this org */
  organisation_id?: string
  /** Volunteers with member membership at any of these orgs (org admin) */
  organisation_ids?: string[]
  search?: string
}

async function userIdsForOrgMembership(
  organisationIds: string[],
): Promise<string[]> {
  if (organisationIds.length === 0) return []

  const { data, error } = await supabase
    .from('user_organisations')
    .select('user_id')
    .in('organisation_id', organisationIds)
    .eq('role_in_org', 'member')
    .eq('is_active', true)

  if (error) throw error
  return [...new Set((data ?? []).map((r) => r.user_id))]
}

export async function getVolunteers(filters: VolunteerFilters = {}) {
  const page = filters.page ?? 1
  const perPage = filters.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const orgIds = filters.organisation_id
    ? [filters.organisation_id]
    : (filters.organisation_ids ?? [])

  let memberUserIds: string[] | null = null
  if (orgIds.length > 0) {
    memberUserIds = await userIdsForOrgMembership(orgIds)
    if (memberUserIds.length === 0) {
      return { data: [] as Volunteer[], count: 0 }
    }
  }

  let query = supabase
    .from('volunteers')
    .select('*, users(first_name, last_name, email, phone_number)', {
      count: 'exact',
    })
    .order('total_hours_served', { ascending: false })
    .range(from, to)

  if (memberUserIds) {
    query = query.in('user_id', memberUserIds)
  }

  if (filters.search) {
    query = query.or(
      `users.first_name.ilike.%${filters.search}%,users.last_name.ilike.%${filters.search}%`,
    )
  }

  const { data, error, count } = await query
  if (error) throw error

  const volunteers = (data ?? []) as Volunteer[]
  const orgByUser = await volunteerOrganisationNamesByUserId(
    volunteers.map((v) => v.user_id),
  )

  return {
    data: volunteers.map((v) => ({
      ...v,
      organisation_names: orgByUser.get(v.user_id) ?? [],
    })),
    count: count ?? 0,
  }
}

export async function getVolunteer(id: string) {
  const { data, error } = await supabase
    .from('volunteers')
    .select('*, users(*)')
    .eq('id', id)
    .single()
  if (error) throw error

  const volunteer = data as Volunteer
  const orgByUser = await volunteerOrganisationNamesByUserId([volunteer.user_id])
  return {
    ...volunteer,
    organisation_names: orgByUser.get(volunteer.user_id) ?? [],
  }
}

export async function getVolunteerAssignments(
  id: string,
  options?: { organisation_ids?: string[] },
) {
  let query = supabase
    .from('volunteer_assignments')
    .select(
      '*, volunteer_opportunities(title, start_date), organisations(name)',
    )
    .eq('volunteer_id', id)
    .order('applied_at', { ascending: false })

  if (options?.organisation_ids?.length) {
    query = query.in('organisation_id', options.organisation_ids)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

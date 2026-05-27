import { supabase } from '@/lib/supabase'
import type {
  PaginationParams,
  Volunteer,
  VolunteerAssignment,
  VolunteerOpportunity,
} from '@/types/entities'
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
  organisation_id?: string
  search?: string
}

export async function getVolunteers(filters: VolunteerFilters = {}) {
  const page = filters.page ?? 1
  const perPage = filters.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('volunteers')
    .select('*, users(first_name, last_name, email, phone_number)', {
      count: 'exact',
    })
    .order('total_hours_served', { ascending: false })
    .range(from, to)

  if (filters.search) {
    query = query.or(
      `users.first_name.ilike.%${filters.search}%,users.last_name.ilike.%${filters.search}%`,
    )
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data: (data ?? []) as Volunteer[], count: count ?? 0 }
}

export async function getVolunteer(id: string) {
  const { data, error } = await supabase
    .from('volunteers')
    .select('*, users(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Volunteer
}

export async function getVolunteerAssignments(id: string) {
  const { data, error } = await supabase
    .from('volunteer_assignments')
    .select('*, volunteer_opportunities(title, start_date)')
    .eq('volunteer_id', id)
    .order('applied_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

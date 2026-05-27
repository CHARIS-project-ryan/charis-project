import { supabase } from '@/lib/supabase'
import type { Campaign, Donation, PaginationParams } from '@/types/entities'
import { createAuditLog } from './audit'

export interface CampaignFilters extends PaginationParams {
  organisation_id?: string
  is_active?: boolean
  search?: string
}

export async function getCampaigns(filters: CampaignFilters = {}) {
  const page = filters.page ?? 1
  const perPage = filters.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('campaigns')
    .select('*, organisations(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.organisation_id)
    query = query.eq('organisation_id', filters.organisation_id)
  if (filters.is_active !== undefined)
    query = query.eq('is_active', filters.is_active)
  if (filters.search) query = query.ilike('title', `%${filters.search}%`)

  const { data, error, count } = await query
  if (error) throw error
  return { data: (data ?? []) as Campaign[], count: count ?? 0 }
}

export async function getCampaign(id: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, organisations(name)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Campaign
}

export async function getCampaignDonations(id: string) {
  const { data, error } = await supabase
    .from('donations')
    .select('*, donors(users(first_name, last_name, email))')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Donation[]
}

export async function createCampaign(
  input: Omit<Campaign, 'id' | 'created_at' | 'current_amount' | 'organisations'>,
) {
  const { data, error } = await supabase
    .from('campaigns')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  await createAuditLog({
    action: 'create',
    table_name: 'campaigns',
    record_id: data.id,
    organisation_id: data.organisation_id,
  })
  return data as Campaign
}

export async function updateCampaign(id: string, input: Partial<Campaign>) {
  const { data, error } = await supabase
    .from('campaigns')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  await createAuditLog({
    action: 'update',
    table_name: 'campaigns',
    record_id: id,
    organisation_id: data.organisation_id,
    changes: input,
  })
  return data as Campaign
}

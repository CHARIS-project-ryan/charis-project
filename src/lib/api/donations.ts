import { supabase } from '@/lib/supabase'
import type { Donation, Donor, PaginationParams } from '@/types/entities'
import { createAuditLog } from './audit'

export interface DonationFilters extends PaginationParams {
  organisation_id?: string
  campaign_id?: string
  payment_status?: Donation['payment_status']
}

export async function getDonations(filters: DonationFilters = {}) {
  const page = filters.page ?? 1
  const perPage = filters.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('donations')
    .select(
      '*, campaigns(title), organisations(name), donors(users(first_name, last_name, email))',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.organisation_id)
    query = query.eq('organisation_id', filters.organisation_id)
  if (filters.campaign_id) query = query.eq('campaign_id', filters.campaign_id)
  if (filters.payment_status)
    query = query.eq('payment_status', filters.payment_status)

  const { data, error, count } = await query
  if (error) throw error
  return { data: (data ?? []) as Donation[], count: count ?? 0 }
}

export async function getDonation(id: string) {
  const { data, error } = await supabase
    .from('donations')
    .select('*, campaigns(title), organisations(name)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Donation
}

export async function updateDonationStatus(
  id: string,
  status: Donation['payment_status'],
) {
  const { data, error } = await supabase
    .from('donations')
    .update({ payment_status: status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  await createAuditLog({
    action: 'update',
    table_name: 'donations',
    record_id: id,
    organisation_id: data.organisation_id,
    changes: { payment_status: status },
  })
  return data as Donation
}

export interface DonorFilters extends PaginationParams {
  search?: string
}

export async function getDonors(filters: DonorFilters = {}) {
  const page = filters.page ?? 1
  const perPage = filters.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('donors')
    .select('*, users(first_name, last_name, email)', { count: 'exact' })
    .order('total_donated', { ascending: false })
    .range(from, to)

  if (filters.search) {
    query = query.or(
      `users.first_name.ilike.%${filters.search}%,users.last_name.ilike.%${filters.search}%`,
    )
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data: (data ?? []) as Donor[], count: count ?? 0 }
}

export async function getDonor(id: string) {
  const { data, error } = await supabase
    .from('donors')
    .select('*, users(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Donor
}

export async function getDonorDonations(id: string) {
  const { data, error } = await supabase
    .from('donations')
    .select('*, campaigns(title)')
    .eq('donor_id', id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Donation[]
}

export async function getDashboardStats() {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    orgs,
    volunteers,
    donors,
    donations,
    opportunities,
    pending,
  ] = await Promise.all([
    supabase.from('organisations').select('id', { count: 'exact', head: true }),
    supabase.from('volunteers').select('id', { count: 'exact', head: true }),
    supabase.from('donors').select('id', { count: 'exact', head: true }),
    supabase
      .from('donations')
      .select('amount')
      .eq('payment_status', 'completed')
      .gte('donated_at', startOfMonth.toISOString()),
    supabase
      .from('volunteer_opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('volunteer_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const donationsThisMonth = (donations.data ?? []).reduce(
    (sum, d) => sum + Number(d.amount),
    0,
  )

  return {
    organisations: orgs.count ?? 0,
    volunteers: volunteers.count ?? 0,
    donors: donors.count ?? 0,
    donationsThisMonth,
    openOpportunities: opportunities.count ?? 0,
    pendingApplications: pending.count ?? 0,
  }
}

export async function getMonthlyDonations() {
  const { data, error } = await supabase
    .from('donations')
    .select('amount, donated_at')
    .eq('payment_status', 'completed')
    .gte(
      'donated_at',
      new Date(new Date().setMonth(new Date().getMonth() - 11)).toISOString(),
    )
  if (error) throw error

  const byMonth = new Map<string, number>()
  for (const row of data ?? []) {
    if (!row.donated_at) continue
    const key = row.donated_at.slice(0, 7)
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(row.amount))
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }))
}

export async function getTopCampaigns(limit = 5) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, title, goal_amount, current_amount, organisations(name)')
    .eq('is_active', true)
    .order('current_amount', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((c) => ({
    ...c,
    percent: Math.round((Number(c.current_amount) / Number(c.goal_amount)) * 100),
  }))
}

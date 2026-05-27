import { relationName } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type {
  DonorBreakdownRow,
  OrganisationBreakdownRow,
} from '@/types/entities'

function startOfMonthIso() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export async function getOrganisationDashboardBreakdown(): Promise<
  OrganisationBreakdownRow[]
> {
  const monthStart = startOfMonthIso()

  const [orgsRes, donationsRes, membershipsRes, assignmentsRes, campaignsRes, oppsRes] =
    await Promise.all([
      supabase
        .from('organisations')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('donations')
        .select('organisation_id, donor_id, amount, donated_at')
        .eq('payment_status', 'completed'),
      supabase
        .from('user_organisations')
        .select('organisation_id, user_id')
        .eq('role_in_org', 'member')
        .eq('is_active', true),
      supabase
        .from('volunteer_assignments')
        .select('organisation_id, volunteer_id, status'),
      supabase.from('campaigns').select('organisation_id').eq('is_active', true),
      supabase
        .from('volunteer_opportunities')
        .select('organisation_id')
        .eq('is_active', true),
    ])

  if (orgsRes.error) throw orgsRes.error
  if (donationsRes.error) throw donationsRes.error
  if (membershipsRes.error) throw membershipsRes.error
  if (assignmentsRes.error) throw assignmentsRes.error
  if (campaignsRes.error) throw campaignsRes.error
  if (oppsRes.error) throw oppsRes.error

  const orgs = orgsRes.data ?? []
  const byOrg = new Map(
    orgs.map((o) => [
      o.id,
      {
        organisationId: o.id,
        organisationName: o.name,
        slug: o.slug,
        volunteers: 0,
        donors: 0,
        donationsThisMonth: 0,
        totalDonations: 0,
        campaigns: 0,
        openOpportunities: 0,
        pendingApplications: 0,
      } satisfies OrganisationBreakdownRow,
    ]),
  )

  const donorSets = new Map<string, Set<string>>()
  const volunteerSets = new Map<string, Set<string>>()

  const { data: volunteerUserIds } = await supabase
    .from('volunteers')
    .select('user_id')
  const volunteerUserSet = new Set(
    (volunteerUserIds ?? []).map((v) => v.user_id),
  )

  for (const m of membershipsRes.data ?? []) {
    if (!volunteerUserSet.has(m.user_id)) continue
    if (!volunteerSets.has(m.organisation_id)) {
      volunteerSets.set(m.organisation_id, new Set())
    }
    volunteerSets.get(m.organisation_id)!.add(m.user_id)
  }

  for (const d of donationsRes.data ?? []) {
    const row = byOrg.get(d.organisation_id)
    if (!row) continue
    const amount = Number(d.amount)
    row.totalDonations += amount
    if (d.donated_at && d.donated_at >= monthStart) {
      row.donationsThisMonth += amount
    }
    if (!donorSets.has(d.organisation_id)) {
      donorSets.set(d.organisation_id, new Set())
    }
    donorSets.get(d.organisation_id)!.add(d.donor_id)
  }

  for (const [orgId, set] of donorSets) {
    const row = byOrg.get(orgId)
    if (row) row.donors = set.size
  }

  for (const a of assignmentsRes.data ?? []) {
    const row = byOrg.get(a.organisation_id)
    if (row && a.status === 'pending') row.pendingApplications += 1
  }

  for (const [orgId, set] of volunteerSets) {
    const row = byOrg.get(orgId)
    if (row) row.volunteers = set.size
  }

  for (const c of campaignsRes.data ?? []) {
    const row = byOrg.get(c.organisation_id)
    if (row) row.campaigns += 1
  }

  for (const o of oppsRes.data ?? []) {
    const row = byOrg.get(o.organisation_id)
    if (row) row.openOpportunities += 1
  }

  return Array.from(byOrg.values())
}

export async function getDonorDashboardBreakdown(): Promise<DonorBreakdownRow[]> {
  const monthStart = startOfMonthIso()

  const { data, error } = await supabase
    .from('donations')
    .select(
      'donor_id, organisation_id, amount, donated_at, donors(users(first_name, last_name, email)), organisations(name)',
    )
    .eq('payment_status', 'completed')
    .order('donated_at', { ascending: false })

  if (error) throw error

  const byDonor = new Map<string, DonorBreakdownRow>()

  for (const row of data ?? []) {
    const donorId = row.donor_id
    const user = row.donors as {
      users?: { first_name: string; last_name: string; email: string }
    } | null
    const u = user?.users
    const name = u
      ? `${u.first_name} ${u.last_name}`.trim()
      : 'Anonymous'
    const email = u?.email ?? '—'
    const orgName = relationName(row.organisations) ?? 'Unknown'
    const orgId = row.organisation_id
    const amount = Number(row.amount)

    if (!byDonor.has(donorId)) {
      byDonor.set(donorId, {
        donorId,
        name,
        email,
        totalDonated: 0,
        donationsThisMonth: 0,
        donationCount: 0,
        byOrganisation: [],
      })
    }

    const d = byDonor.get(donorId)!
    d.totalDonated += amount
    d.donationCount += 1
    if (row.donated_at && row.donated_at >= monthStart) {
      d.donationsThisMonth += amount
    }

    const existing = d.byOrganisation.find((o) => o.organisationId === orgId)
    if (existing) {
      existing.amount += amount
      existing.count += 1
    } else {
      d.byOrganisation.push({
        organisationId: orgId,
        organisationName: orgName,
        amount,
        count: 1,
      })
    }
  }

  return Array.from(byDonor.values()).sort(
    (a, b) => b.totalDonated - a.totalDonated,
  )
}

export async function getDonationsThisMonthByOrganisation() {
  const rows = await getOrganisationDashboardBreakdown()
  return rows
    .filter((r) => r.donationsThisMonth > 0)
    .sort((a, b) => b.donationsThisMonth - a.donationsThisMonth)
}

export async function getDonationsThisMonthByDonor() {
  const rows = await getDonorDashboardBreakdown()
  return rows
    .filter((r) => r.donationsThisMonth > 0)
    .sort((a, b) => b.donationsThisMonth - a.donationsThisMonth)
}

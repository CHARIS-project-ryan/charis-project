import { formatName } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type { Organisation, OrganisationVolunteerRow } from '@/types/entities'
import { createAuditLog } from './audit'

export async function getOrganisations() {
  const { data, error } = await supabase
    .from('organisations')
    .select('*')
    .order('name')
  if (error) throw error
  return (data ?? []) as Organisation[]
}

export async function getOrganisation(id: string) {
  const { data, error } = await supabase
    .from('organisations')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Organisation
}

export async function createOrganisation(
  input: Pick<Organisation, 'name' | 'slug'> &
    Partial<
      Pick<
        Organisation,
        | 'description'
        | 'contact_email'
        | 'contact_phone'
        | 'website_url'
        | 'logo_url'
      >
    >,
) {
  const { data, error } = await supabase
    .from('organisations')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  await createAuditLog({
    action: 'create',
    table_name: 'organisations',
    record_id: data.id,
  })
  return data as Organisation
}

export async function updateOrganisation(
  id: string,
  input: Partial<Organisation>,
) {
  const { data, error } = await supabase
    .from('organisations')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  await createAuditLog({
    action: 'update',
    table_name: 'organisations',
    record_id: id,
    changes: input,
  })
  return data as Organisation
}

export async function deactivateOrganisation(id: string) {
  return updateOrganisation(id, { is_active: false })
}

export async function getOrganisationAssignments(
  organisationId: string,
  status?: 'pending' | 'confirmed' | 'completed',
) {
  let query = supabase
    .from('volunteer_assignments')
    .select(
      '*, volunteers(id, total_hours_served, users(first_name, last_name, email)), volunteer_opportunities(title, start_date)',
    )
    .eq('organisation_id', organisationId)
    .order('applied_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getOrganisationDonors(organisationId: string) {
  const { data, error } = await supabase
    .from('donations')
    .select(
      'donor_id, amount, donors(id, users(first_name, last_name, email))',
    )
    .eq('organisation_id', organisationId)
    .eq('payment_status', 'completed')

  if (error) throw error

  const byDonor = new Map<
    string,
    {
      donorId: string
      name: string
      email: string
      totalAtOrg: number
      donationCount: number
    }
  >()

  for (const row of data ?? []) {
    const raw = row.donors as unknown
    const donor = (Array.isArray(raw) ? raw[0] : raw) as {
      id: string
      users?: { first_name: string; last_name: string; email: string }
    } | null
    if (!donor) continue
    const u = donor.users
    const name = u
      ? `${u.first_name} ${u.last_name}`.trim()
      : 'Donor'
    const existing = byDonor.get(donor.id)
    const amount = Number(row.amount)
    if (existing) {
      existing.totalAtOrg += amount
      existing.donationCount += 1
    } else {
      byDonor.set(donor.id, {
        donorId: donor.id,
        name,
        email: u?.email ?? '—',
        totalAtOrg: amount,
        donationCount: 1,
      })
    }
  }

  return Array.from(byDonor.values()).sort((a, b) => b.totalAtOrg - a.totalAtOrg)
}

/** Volunteers with explicit membership (user_organisations.role_in_org = member). */
export async function getOrganisationVolunteerMembers(
  organisationId: string,
): Promise<OrganisationVolunteerRow[]> {
  const { data: memberships, error: memError } = await supabase
    .from('user_organisations')
    .select('user_id, joined_at')
    .eq('organisation_id', organisationId)
    .eq('role_in_org', 'member')
    .eq('is_active', true)

  if (memError) throw memError
  if (!memberships?.length) return []

  const joinedByUser = new Map(
    memberships.map((m) => [m.user_id, m.joined_at as string]),
  )
  const userIds = [...joinedByUser.keys()]

  const { data: volunteers, error: volError } = await supabase
    .from('volunteers')
    .select('id, user_id, users(first_name, last_name, email)')
    .in('user_id', userIds)

  if (volError) throw volError

  const { data: assignments, error: assignError } = await supabase
    .from('volunteer_assignments')
    .select('volunteer_id, hours_served')
    .eq('organisation_id', organisationId)

  if (assignError) throw assignError

  const hoursByVolunteer = new Map<string, { hours: number; count: number }>()
  for (const a of assignments ?? []) {
    const cur = hoursByVolunteer.get(a.volunteer_id) ?? { hours: 0, count: 0 }
    cur.hours += Number(a.hours_served ?? 0)
    cur.count += 1
    hoursByVolunteer.set(a.volunteer_id, cur)
  }

  const rows: OrganisationVolunteerRow[] = []

  for (const vol of volunteers ?? []) {
    const rawUser = vol.users as unknown
    const u = (Array.isArray(rawUser) ? rawUser[0] : rawUser) as {
      first_name: string
      last_name: string
      email: string
    } | null
    const stats = hoursByVolunteer.get(vol.id) ?? { hours: 0, count: 0 }
    rows.push({
      volunteerId: vol.id,
      name: formatName(u),
      email: u?.email ?? '—',
      joinedAt: joinedByUser.get(vol.user_id) ?? '',
      hoursAtOrg: stats.hours,
      assignmentCount: stats.count,
    })
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getVolunteerMemberOrganisationIds(
  volunteerId: string,
): Promise<string[]> {
  const { data: vol, error: volError } = await supabase
    .from('volunteers')
    .select('user_id')
    .eq('id', volunteerId)
    .single()
  if (volError) throw volError

  const { data, error } = await supabase
    .from('user_organisations')
    .select('organisation_id')
    .eq('user_id', vol.user_id)
    .eq('role_in_org', 'member')
    .eq('is_active', true)

  if (error) throw error
  return (data ?? []).map((r) => r.organisation_id)
}

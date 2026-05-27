import { relationName } from '@/lib/format'
import { supabase } from '@/lib/supabase'

function addOrgName(map: Map<string, string[]>, key: string, name: string) {
  const list = map.get(key) ?? []
  if (!list.includes(name)) list.push(name)
  map.set(key, list)
}

export async function volunteerOrganisationNamesByUserId(
  userIds: string[],
): Promise<Map<string, string[]>> {
  const byUser = new Map<string, string[]>()
  if (userIds.length === 0) return byUser

  const { data, error } = await supabase
    .from('user_organisations')
    .select('user_id, organisations(name)')
    .in('user_id', userIds)
    .eq('role_in_org', 'member')
    .eq('is_active', true)

  if (error) throw error

  for (const row of data ?? []) {
    const name = relationName(
      row.organisations as { name: string } | { name: string }[] | null,
    )
    if (name) addOrgName(byUser, row.user_id, name)
  }

  for (const [, names] of byUser) {
    names.sort((a, b) => a.localeCompare(b))
  }
  return byUser
}

export async function donorOrganisationNamesByDonorId(
  donorIds: string[],
): Promise<Map<string, string[]>> {
  const byDonor = new Map<string, string[]>()
  if (donorIds.length === 0) return byDonor

  const { data, error } = await supabase
    .from('donations')
    .select('donor_id, organisations(name)')
    .in('donor_id', donorIds)
    .eq('payment_status', 'completed')

  if (error) throw error

  for (const row of data ?? []) {
    const name = relationName(
      row.organisations as { name: string } | { name: string }[] | null,
    )
    if (name) addOrgName(byDonor, row.donor_id, name)
  }

  for (const [, names] of byDonor) {
    names.sort((a, b) => a.localeCompare(b))
  }
  return byDonor
}

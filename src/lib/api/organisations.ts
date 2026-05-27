import { supabase } from '@/lib/supabase'
import type { Organisation } from '@/types/entities'
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

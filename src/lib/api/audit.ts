import { supabase } from '@/lib/supabase'
import type { AuditAction, AuditLog } from '@/types/entities'

export interface AuditLogFilters {
  action?: AuditAction
  organisation_id?: string
  from?: string
  to?: string
  page?: number
  per_page?: number
}

export interface CreateAuditLogInput {
  action: AuditAction
  table_name: string
  record_id?: string
  changes?: Record<string, unknown>
  organisation_id?: string
}

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const page = filters.page ?? 1
  const perPage = filters.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('audit_logs')
    .select('*, users(first_name, last_name, email)', { count: 'exact' })
    .order('timestamp', { ascending: false })
    .range(from, to)

  if (filters.action) query = query.eq('action', filters.action)
  if (filters.organisation_id)
    query = query.eq('organisation_id', filters.organisation_id)
  if (filters.from) query = query.gte('timestamp', filters.from)
  if (filters.to) query = query.lte('timestamp', filters.to)

  const { data, error, count } = await query
  if (error) throw error
  return { data: (data ?? []) as AuditLog[], count: count ?? 0 }
}

export async function createAuditLog(input: CreateAuditLogInput) {
  const { data: userData } = await supabase.auth.getUser()
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userData.user?.id ?? null,
    action: input.action,
    table_name: input.table_name,
    record_id: input.record_id ?? null,
    changes: input.changes ?? null,
    organisation_id: input.organisation_id ?? null,
  })
  if (error) throw error
}

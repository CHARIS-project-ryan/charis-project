export function formatCurrency(amount: number, currency = 'SGD') {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

type NameFields = {
  first_name?: string
  last_name?: string
  email?: string
}

export function formatName(user?: NameFields | NameFields[] | null) {
  const u = Array.isArray(user) ? user[0] : user
  if (!u) return '—'
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ')
  return name || u.email || '—'
}

/** Unwrap donors → users from a donation row (PostgREST may return arrays). */
export function donorUserFromDonation(
  donation?: {
    donors?:
      | { users?: NameFields | NameFields[] }
      | { users?: NameFields | NameFields[] }[]
      | null
  } | null,
) {
  const raw = donation?.donors
  const donor = Array.isArray(raw) ? raw[0] : raw
  if (!donor) return undefined
  const users = donor.users
  return Array.isArray(users) ? users[0] : users
}

/** Supabase joins may return a single row or an array depending on inference. */
export function relationName(
  rel?: { name: string } | { name: string }[] | null,
): string | undefined {
  if (!rel) return undefined
  return Array.isArray(rel) ? rel[0]?.name : rel.name
}

export function formatCurrency(amount: number, currency = 'SGD') {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatName(
  user?: { first_name?: string; last_name?: string; email?: string } | null,
) {
  if (!user) return '—'
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ')
  return name || user.email || '—'
}

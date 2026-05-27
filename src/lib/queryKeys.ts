export const queryKeys = {
  organisations: {
    all: ['organisations'] as const,
    detail: (id: string) => ['organisations', id] as const,
    donors: (id: string) => ['organisations', id, 'donors'] as const,
    volunteers: (id: string) => ['organisations', id, 'volunteers'] as const,
    assignments: (id: string, status?: string) =>
      ['organisations', id, 'assignments', status ?? 'all'] as const,
  },
  campaigns: {
    all: (filters?: object) => ['campaigns', filters ?? {}] as const,
    detail: (id: string) => ['campaigns', id] as const,
    donations: (id: string) => ['campaigns', id, 'donations'] as const,
  },
  opportunities: {
    all: (filters?: object) => ['opportunities', filters ?? {}] as const,
    detail: (id: string) => ['opportunities', id] as const,
    roster: (id: string) => ['opportunities', id, 'roster'] as const,
  },
  volunteers: {
    all: (filters?: object) => ['volunteers', filters ?? {}] as const,
    detail: (id: string) => ['volunteers', id] as const,
    assignments: (id: string) => ['volunteers', id, 'assignments'] as const,
  },
  donors: {
    all: (filters?: object) => ['donors', filters ?? {}] as const,
    detail: (id: string) => ['donors', id] as const,
    donations: (id: string) => ['donors', id, 'donations'] as const,
  },
  donations: {
    all: (filters?: object) => ['donations', filters ?? {}] as const,
    detail: (id: string) => ['donations', id] as const,
  },
  auditLogs: {
    all: (filters?: object) => ['audit-logs', filters ?? {}] as const,
  },
  users: {
    all: (filters?: object) => ['users', filters ?? {}] as const,
    detail: (id: string) => ['users', id] as const,
  },
  dashboard: {
    scope: (userId: string | null, role: string | null) =>
      ['dashboard', userId ?? 'anon', role ?? 'none'] as const,
    stats: (userId: string | null, role: string | null) =>
      ['dashboard', userId ?? 'anon', role ?? 'none', 'stats'] as const,
    monthlyDonations: (userId: string | null, role: string | null) =>
      ['dashboard', userId ?? 'anon', role ?? 'none', 'monthly-donations'] as const,
    topCampaigns: (userId: string | null, role: string | null) =>
      ['dashboard', userId ?? 'anon', role ?? 'none', 'top-campaigns'] as const,
    orgBreakdown: (userId: string | null, role: string | null) =>
      ['dashboard', userId ?? 'anon', role ?? 'none', 'org-breakdown'] as const,
    donorBreakdown: (userId: string | null, role: string | null) =>
      ['dashboard', userId ?? 'anon', role ?? 'none', 'donor-breakdown'] as const,
  },
}

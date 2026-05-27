export const queryKeys = {
  organisations: {
    all: ['organisations'] as const,
    detail: (id: string) => ['organisations', id] as const,
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
    stats: ['dashboard', 'stats'] as const,
    monthlyDonations: ['dashboard', 'monthly-donations'] as const,
    topCampaigns: ['dashboard', 'top-campaigns'] as const,
  },
}

export type UserRole = 'super_admin' | 'org_admin' | 'volunteer' | 'donor'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type AssignmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'

export interface Organisation {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AppUser {
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number: string | null
  profile_image_url: string | null
  role: UserRole
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

export interface Campaign {
  id: string
  organisation_id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  goal_amount: number
  current_amount: number
  currency: string
  start_date: string | null
  end_date: string | null
  image_url: string | null
  is_featured: boolean
  is_active: boolean
  category: string | null
  created_at: string
  organisations?: { name: string }
}

export interface VolunteerOpportunity {
  id: string
  organisation_id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  location: string | null
  location_address: string | null
  start_date: string | null
  end_date: string | null
  slots_total: number
  slots_filled: number
  is_active: boolean
  category: string | null
  organisations?: { name: string }
}

export interface Volunteer {
  id: string
  user_id: string
  total_hours_served: number
  is_active: boolean
  users?: AppUser
  /** Member orgs (from user_organisations), sorted by name */
  organisation_names?: string[]
}

export interface Donor {
  id: string
  user_id: string
  total_donated: number
  donation_count: number
  is_active: boolean
  users?: AppUser
  /** Orgs with at least one completed donation, sorted by name */
  organisation_names?: string[]
}

export interface Donation {
  id: string
  donor_id: string
  campaign_id: string | null
  organisation_id: string
  amount: number
  currency: string
  payment_status: PaymentStatus
  is_anonymous: boolean
  donated_at: string | null
  tax_receipt_issued: boolean
  tax_receipt_number: string | null
  created_at: string
  donors?: { users?: AppUser }
  campaigns?: { title: string }
  organisations?: { name: string }
}

export interface VolunteerAssignment {
  id: string
  volunteer_id: string
  opportunity_id: string
  organisation_id: string
  status: AssignmentStatus
  applied_at: string
  hours_served: number | null
  volunteers?: Volunteer
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: AuditAction
  table_name: string
  record_id: string | null
  timestamp: string
  organisation_id: string | null
  users?: AppUser
}

export interface PaginationParams {
  page?: number
  per_page?: number
}

export interface DashboardStats {
  organisations: number
  volunteers: number
  donors: number
  donationsThisMonth: number
  openOpportunities: number
  pendingApplications: number
}

export interface OrganisationBreakdownRow {
  organisationId: string
  organisationName: string
  slug: string
  volunteers: number
  donors: number
  donationsThisMonth: number
  totalDonations: number
  campaigns: number
  openOpportunities: number
  pendingApplications: number
}

export interface DonorOrgSlice {
  organisationId: string
  organisationName: string
  amount: number
  count: number
}

export interface DonorBreakdownRow {
  donorId: string
  name: string
  email: string
  totalDonated: number
  donationsThisMonth: number
  donationCount: number
  byOrganisation: DonorOrgSlice[]
}

export type DashboardDrillMetric =
  | 'organisations'
  | 'volunteers'
  | 'donors'
  | 'donations'
  | 'opportunities'
  | 'applications'

export type OrganisationDetailTab =
  | 'overview'
  | 'campaigns'
  | 'donations'
  | 'donors'
  | 'volunteers'
  | 'opportunities'
  | 'applications'

export interface OrganisationDonorRow {
  donorId: string
  name: string
  email: string
  totalAtOrg: number
  donationCount: number
}

export interface OrganisationVolunteerRow {
  volunteerId: string
  name: string
  email: string
  joinedAt: string
  hoursAtOrg: number
  assignmentCount: number
}

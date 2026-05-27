export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone_number: string | null
          profile_image_url: string | null
          role: 'super_admin' | 'org_admin' | 'volunteer' | 'donor'
          is_active: boolean
          last_login_at: string | null
          pdpa_consent_given: boolean
          pdpa_consent_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['users']['Row']> & {
          id: string
          email: string
          first_name: string
          last_name: string
        }
        Update: Partial<Database['public']['Tables']['users']['Row']>
      }
      user_organisations: {
        Row: {
          id: string
          user_id: string
          organisation_id: string
          is_active: boolean
        }
        Insert: {
          user_id: string
          organisation_id: string
          is_active?: boolean
        }
        Update: Partial<{
          user_id: string
          organisation_id: string
          is_active: boolean
        }>
      }
    }
    Enums: {
      user_role: 'super_admin' | 'org_admin' | 'volunteer' | 'donor'
    }
  }
}

export type UserRole = Database['public']['Enums']['user_role']
export type User = Database['public']['Tables']['users']['Row']

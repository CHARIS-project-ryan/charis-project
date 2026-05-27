import type { Session, User as AuthUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/supabase'

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: Extract<UserRole, 'volunteer' | 'donor'>
  pdpaConsentGiven: boolean
  phone?: string
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(data: SignUpData) {
  return supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        pdpa_consent_given: data.pdpaConsentGiven,
        phone_number: data.phone,
      },
    },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getUser()
  return data.user
}

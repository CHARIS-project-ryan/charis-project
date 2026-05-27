import type { Session, User as AuthUser } from '@supabase/supabase-js'
import { debugError, debugLog } from '@/lib/debug'
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
  debugLog('auth', 'signIn attempt', { email })
  const result = await supabase.auth.signInWithPassword({ email, password })
  if (result.error) {
    debugError('auth', 'signIn failed', result.error)
  } else {
    debugLog('auth', 'signIn ok', { userId: result.data.user?.id })
  }
  return result
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
  const { data, error } = await supabase.auth.getSession()
  if (error) debugError('auth', 'getSession error', error)
  debugLog('auth', 'getSession', {
    hasSession: !!data.session,
    email: data.session?.user?.email,
  })
  return data.session
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getUser()
  return data.user
}

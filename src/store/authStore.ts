import { create } from 'zustand'
import { getSession, signOut as authSignOut } from '@/lib/auth'
import { queryClient } from '@/lib/queryClient'
import { debugError, debugLog, debugWarn } from '@/lib/debug'
import { supabase } from '@/lib/supabase'
import type { User, UserRole } from '@/types/supabase'

interface AuthState {
  user: User | null
  session: Awaited<ReturnType<typeof getSession>>
  role: UserRole | null
  orgIds: string[]
  isLoading: boolean
  initialize: () => Promise<void>
  signOut: () => Promise<void>
  isSuperAdmin: () => boolean
  isOrgAdmin: () => boolean
  canAccessOrg: (orgId: string) => boolean
}

/** Defer past auth lock — async Supabase calls inside onAuthStateChange deadlock. */
function deferAuthWork(fn: () => void | Promise<void>) {
  queueMicrotask(() => {
    void fn()
  })
}

let profileFetchGeneration = 0

async function fetchUserProfile(userId: string): Promise<{
  user: User | null
  orgIds: string[]
}> {
  const gen = ++profileFetchGeneration
  debugLog('auth', 'fetchUserProfile start', { userId, gen })

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError) {
    debugError('auth', 'fetchUserProfile users query failed', userError)
  } else {
    debugLog('auth', 'fetchUserProfile users ok', {
      email: user?.email,
      role: user?.role,
      gen,
    })
  }

  const { data: orgRows, error: orgError } = await supabase
    .from('user_organisations')
    .select('organisation_id')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (orgError) {
    debugError('auth', 'fetchUserProfile orgs query failed', orgError)
  }

  const orgIds = (orgRows ?? []).map(
    (row) => (row as { organisation_id: string }).organisation_id,
  )

  debugLog('auth', 'fetchUserProfile done', { orgCount: orgIds.length, gen })

  return {
    user: user as User | null,
    orgIds,
  }
}

async function applySession(
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
) {
  debugLog('auth', 'applySession start', {
    userId: session.user.id,
    email: session.user.email,
  })
  const { user, orgIds } = await fetchUserProfile(session.user.id)
  useAuthStore.setState({
    session,
    user,
    role: user?.role ?? null,
    orgIds,
    isLoading: false,
  })
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  debugLog('auth', 'applySession complete', { role: user?.role ?? null })
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  role: null,
  orgIds: [],
  isLoading: true,

  initialize: async () => {
    debugLog('auth', 'initialize start')
    set({ isLoading: true })
    const session = await getSession()

    if (!session?.user) {
      debugWarn('auth', 'initialize — no session')
      set({
        user: null,
        session: null,
        role: null,
        orgIds: [],
        isLoading: false,
      })
      return
    }

    debugLog('auth', 'initialize session found — deferring profile fetch')
    deferAuthWork(() => applySession(session))
  },

  signOut: async () => {
    await authSignOut()
    queryClient.clear()
    set({
      user: null,
      session: null,
      role: null,
      orgIds: [],
      isLoading: false,
    })
  },

  isSuperAdmin: () => get().role === 'super_admin',
  isOrgAdmin: () => get().role === 'org_admin',
  canAccessOrg: (orgId: string) => {
    const state = get()
    if (state.role === 'super_admin') return true
    return state.orgIds.includes(orgId)
  },
}))

let subscribed = false

export function subscribeToAuthChanges() {
  if (subscribed) return
  subscribed = true

  supabase.auth.onAuthStateChange((event, session) => {
    debugLog('auth', `onAuthStateChange: ${event}`, {
      hasSession: !!session,
      email: session?.user?.email,
    })

    if (!session?.user) {
      useAuthStore.setState({
        user: null,
        session: null,
        role: null,
        orgIds: [],
        isLoading: false,
      })
      return
    }

    // Never await Supabase here — defers to avoid auth client deadlock
    useAuthStore.setState({ isLoading: true })
    deferAuthWork(() => applySession(session))
  })
}

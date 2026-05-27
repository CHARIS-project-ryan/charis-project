import { create } from 'zustand'
import { getSession, signOut as authSignOut } from '@/lib/auth'
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

async function fetchUserProfile(userId: string): Promise<{
  user: User | null
  orgIds: string[]
}> {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  const { data: orgRows } = await supabase
    .from('user_organisations')
    .select('organisation_id')
    .eq('user_id', userId)
    .eq('is_active', true)

  const orgIds = (orgRows ?? []).map(
    (row) => (row as { organisation_id: string }).organisation_id,
  )

  return {
    user: user as User | null,
    orgIds,
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  role: null,
  orgIds: [],
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true })
    const session = await getSession()

    if (!session?.user) {
      set({
        user: null,
        session: null,
        role: null,
        orgIds: [],
        isLoading: false,
      })
      return
    }

    const { user, orgIds } = await fetchUserProfile(session.user.id)
    set({
      session,
      user,
      role: user?.role ?? null,
      orgIds,
      isLoading: false,
    })
  },

  signOut: async () => {
    await authSignOut()
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

  supabase.auth.onAuthStateChange(async (_event, session) => {
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

    const { user, orgIds } = await fetchUserProfile(session.user.id)
    useAuthStore.setState({
      session,
      user,
      role: user?.role ?? null,
      orgIds,
      isLoading: false,
    })
  })
}

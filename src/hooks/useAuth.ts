import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const store = useAuthStore()
  return {
    user: store.user,
    session: store.session,
    role: store.role,
    orgIds: store.orgIds,
    isLoading: store.isLoading,
    isSuperAdmin: store.isSuperAdmin(),
    isOrgAdmin: store.isOrgAdmin(),
    canAccessOrg: store.canAccessOrg,
    signOut: store.signOut,
  }
}

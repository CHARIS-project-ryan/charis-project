import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  activeOrgId: string | null
  sidebarOpen: boolean
  setActiveOrg: (orgId: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeOrgId: null,
      sidebarOpen: true,
      setActiveOrg: (orgId) => set({ activeOrgId: orgId }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    { name: 'charis-ui' },
  ),
)

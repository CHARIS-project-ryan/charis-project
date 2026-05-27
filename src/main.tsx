import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from '@/components/ui/sonner'
import { router } from '@/router'
import { debugLog } from '@/lib/debug'
import { queryClient } from '@/lib/queryClient'
import { subscribeToAuthChanges, useAuthStore } from '@/store/authStore'
import './index.css'

debugLog('app', 'boot', {
  mode: import.meta.env.MODE,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '(missing)',
})

function AppProviders() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    subscribeToAuthChanges()
    void initialize()
  }, [initialize])

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProviders />
    </QueryClientProvider>
  </StrictMode>,
)

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from '@/components/ui/sonner'
import { router } from '@/router'
import { subscribeToAuthChanges, useAuthStore } from '@/store/authStore'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
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

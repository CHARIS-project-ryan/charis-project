import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { debugLog, debugWarn } from '@/lib/debug'
import { useAuthStore } from '@/store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    debugLog('ProtectedRoute', 'state', { isLoading, hasSession: !!session })
    if (!isLoading && !session) {
      debugWarn('ProtectedRoute', 'no session — redirecting to /login')
      navigate({ to: '/login' })
    }
  }, [isLoading, session, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}

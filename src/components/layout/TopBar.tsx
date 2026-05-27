import { useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

interface TopBarProps {
  title: string
}

export function TopBar({ title }: TopBarProps) {
  const navigate = useNavigate()
  const { user, role, signOut } = useAuth()

  const initials = user
    ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
    : 'CH'

  async function handleSignOut() {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-6">
      <h2 className="truncate text-lg font-semibold">{title}</h2>
      <div className="flex shrink-0 items-center gap-3">
        {user && (
          <div className="hidden text-right text-sm sm:block">
            <p className="font-medium leading-none">{user.email}</p>
            {role && (
              <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                {role.replace('_', ' ')}
              </p>
            )}
          </div>
        )}
        <Avatar className="size-8">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="gap-1.5"
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </header>
  )
}

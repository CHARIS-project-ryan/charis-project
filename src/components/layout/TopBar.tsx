import { useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'

interface TopBarProps {
  title: string
}

export function TopBar({ title }: TopBarProps) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const initials = user
    ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
    : 'CH'

  async function handleSignOut() {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="size-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {user && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {user.email}
            </div>
          )}
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

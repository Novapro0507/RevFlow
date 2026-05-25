'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Zap,
  LayoutDashboard,
  Users,
  Target,
  Search,
  Mail,
  MessageSquare,
  Send,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface SidebarProps {
  user: User
  profile: Profile | null
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Contacts', href: '/leads', icon: Users },
  { name: 'Lead Finder', href: '/leads/intent', icon: Search },
  { name: 'Pipeline', href: '/pipeline', icon: Target },
  { name: 'Dispatch', href: '/dispatch', icon: Truck },
  { name: 'Blast Center', href: '/blast', icon: Send },
  { name: 'Sequences', href: '/sequences', icon: Mail },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

export function Sidebar({ user, profile }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : user.email?.[0]?.toUpperCase() || 'U'

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : user.email

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground">Command</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User menu */}
      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors',
                'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {profile?.role || 'Team Member'}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

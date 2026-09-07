'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Zap,
  LayoutDashboard,
  Users,
  Target,
  Search,
  Mail,
  Truck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  Megaphone,
  Bot,
  Lightbulb,
  Sparkles,
  Home,
} from 'lucide-react'

interface SidebarProps {
  user?: User | null
  profile: Profile | null
}

const navigationSections = [
  {
    label: 'COMMAND',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Dispatch', href: '/dispatch', icon: Truck, live: true },
    ]
  },
  {
    label: 'AI AGENTS',
    items: [
      { name: 'Lead Finder', href: '/ai/lead-finder', icon: Bot, ai: true },
      { name: 'Growth Assistant', href: '/ai/growth-assistant', icon: Lightbulb, ai: true },
    ]
  },
  {
    label: 'OPERATIONS',
    items: [
      { name: 'Property Leads', href: '/property-leads', icon: Home },
      { name: 'Contacts', href: '/leads', icon: Users },
      { name: 'Pipeline', href: '/pipeline', icon: Target },
      { name: 'Intent Monitor', href: '/leads/intent', icon: Search },
    ]
  },
  {
    label: 'OUTREACH',
    items: [
      { name: 'Blast Center', href: '/blast', icon: Megaphone },
      { name: 'Sequences', href: '/sequences', icon: Mail },
    ]
  },
  {
    label: 'INSIGHTS',
    items: [
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ]
  },
]

export function Sidebar({ user, profile }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : 'RF'

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : 'RevFlow Workspace'

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
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(234,88,12,0.3)]">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-lg font-bold text-foreground tracking-tight">RevFlow</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Online</span>
              </div>
            </div>
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
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {navigationSections.map((section) => (
          <div key={section.label} className="mb-6">
            {!collapsed && (
              <div className="px-3 mb-2 flex items-center gap-2">
                <span className="text-[10px] font-mono font-semibold text-muted-foreground tracking-widest">
                  {section.label}
                </span>
                <div className="flex-1 h-px bg-sidebar-border" />
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon className={cn(
                      'w-5 h-5 flex-shrink-0',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    {!collapsed && (
                      <>
                        <span className="font-medium">{item.name}</span>
                        {item.live && (
                          <span className="ml-auto flex items-center gap-1">
                            <Radio className="w-3 h-3 text-success animate-pulse" />
                          </span>
                        )}
                        {item.ai && (
                          <span className="ml-auto">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
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
              <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-medium truncate text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile?.role || 'Operator'}
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

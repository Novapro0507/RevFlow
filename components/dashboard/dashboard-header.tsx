'use client'

import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

interface DashboardHeaderProps {
  userName: string
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const greeting = getGreeting()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {userName}
        </h1>
        <p className="text-muted-foreground">
          {"Here's your command center overview."}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" asChild>
          <Link href="/dispatch">
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Link>
        </Button>
        <Button asChild>
          <Link href="/blast">
            <Search className="w-4 h-4 mr-2" />
            Send Blast
          </Link>
        </Button>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

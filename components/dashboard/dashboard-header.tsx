'use client'

import { Button } from '@/components/ui/button'
import { Plus, Megaphone, Radio, Clock } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface DashboardHeaderProps {
  userName: string
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const greeting = getGreeting()
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      }))
      setCurrentDate(now.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-border">
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center border border-primary/20">
          <Radio className="w-6 h-6 text-primary animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {greeting}, {userName}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-mono text-success uppercase tracking-wider">Operational</span>
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5">
            Command Center Overview
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-card border border-border">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <div className="text-right">
            <p className="text-sm font-mono font-bold text-foreground">{currentTime}</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">{currentDate}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="border-border hover:border-primary/50 hover:bg-primary/5">
            <Link href="/dispatch">
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(234,88,12,0.2)]">
            <Link href="/blast">
              <Megaphone className="w-4 h-4 mr-2" />
              Send Blast
            </Link>
          </Button>
        </div>
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

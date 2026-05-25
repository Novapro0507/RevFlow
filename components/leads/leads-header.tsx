'use client'

import { Button } from '@/components/ui/button'
import { Plus, Search, Upload } from 'lucide-react'
import Link from 'next/link'

export function LeadsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leads</h1>
        <p className="text-muted-foreground">
          Manage and track your potential customers
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" asChild>
          <Link href="/leads/intent">
            <Search className="w-4 h-4 mr-2" />
            Intent Monitor
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/leads/discover">
            <Upload className="w-4 h-4 mr-2" />
            Discover
          </Link>
        </Button>
        <Button asChild>
          <Link href="/leads/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Link>
        </Button>
      </div>
    </div>
  )
}

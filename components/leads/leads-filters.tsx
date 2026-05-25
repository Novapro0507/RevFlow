'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Flame, Users } from 'lucide-react'
import { useState, useTransition } from 'react'

interface LeadsFiltersProps {
  currentStatus?: string
  currentType?: string
  currentSearch?: string
  totalCount: number
  hotCount: number
}

export function LeadsFilters({
  currentStatus,
  currentType,
  currentSearch,
  totalCount,
  hotCount,
}: LeadsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(currentSearch || '')

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.push(`/leads?${params.toString()}`)
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter('search', search)
  }

  const isHotFilter = searchParams.get('filter') === 'hot'

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="flex items-center gap-4">
        <Button
          variant={!isHotFilter ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilter('filter', '')}
        >
          <Users className="w-4 h-4 mr-2" />
          All Leads ({totalCount})
        </Button>
        <Button
          variant={isHotFilter ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilter('filter', 'hot')}
        >
          <Flame className="w-4 h-4 mr-2" />
          Hot Leads ({hotCount})
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-input border-border"
            />
          </div>
        </form>

        <Select
          value={currentStatus || 'all'}
          onValueChange={(value) => updateFilter('status', value)}
        >
          <SelectTrigger className="w-40 bg-input border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="unqualified">Unqualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentType || 'all'}
          onValueChange={(value) => updateFilter('type', value)}
        >
          <SelectTrigger className="w-32 bg-input border-border">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="b2b">B2B</SelectItem>
            <SelectItem value="b2c">B2C</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Plus, 
  Flame,
  MoreHorizontal,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import type { Lead } from '@/lib/types'

interface LeadDetailHeaderProps {
  lead: Lead
}

export function LeadDetailHeader({ lead }: LeadDetailHeaderProps) {
  const router = useRouter()
  const [status, setStatus] = useState(lead.status)
  const [updating, setUpdating] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    setStatus(newStatus as Lead['status'])

    const supabase = createClient()
    await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', lead.id)

    setUpdating(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    const supabase = createClient()
    await supabase.from('leads').delete().eq('id', lead.id)
    router.push('/leads')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/leads">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-primary">
              {getInitials(lead.first_name, lead.last_name)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {lead.first_name} {lead.last_name}
              </h1>
              {lead.lead_score >= 70 && (
                <Flame className="w-5 h-5 text-destructive" />
              )}
            </div>
            <p className="text-muted-foreground">
              {lead.job_title && `${lead.job_title} at `}
              {lead.company || 'No company'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={lead.lead_type === 'b2b' ? 'default' : 'secondary'}>
                {lead.lead_type.toUpperCase()}
              </Badge>
              {lead.source && (
                <Badge variant="outline">{lead.source}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={status}
            onValueChange={handleStatusChange}
            disabled={updating}
          >
            <SelectTrigger className="w-36 bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="unqualified">Unqualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>

          {lead.email && (
            <Button variant="outline" asChild>
              <a href={`mailto:${lead.email}`}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </a>
            </Button>
          )}

          {lead.phone && (
            <Button variant="outline" asChild>
              <a href={`tel:${lead.phone}`}>
                <Phone className="w-4 h-4 mr-2" />
                Call
              </a>
            </Button>
          )}

          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Deal
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Add to Sequence</DropdownMenuItem>
              <DropdownMenuItem>Edit Lead</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.[0] || ''
  const last = lastName?.[0] || ''
  return (first + last).toUpperCase() || '?'
}

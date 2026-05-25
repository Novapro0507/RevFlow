'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Building, 
  Flame,
  ExternalLink,
  Plus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import type { Lead } from '@/lib/types'

interface LeadsTableProps {
  leads: Lead[]
}

export function LeadsTable({ leads }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No leads yet</h3>
          <p className="text-muted-foreground text-center mb-4 max-w-sm">
            Start building your pipeline by adding leads manually or discovering them automatically.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/leads/discover">Discover Leads</Link>
            </Button>
            <Button asChild>
              <Link href="/leads/new">Add Lead</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Lead</TableHead>
            <TableHead className="text-muted-foreground">Company</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground">Score</TableHead>
            <TableHead className="text-muted-foreground">Source</TableHead>
            <TableHead className="text-muted-foreground">Added</TableHead>
            <TableHead className="text-muted-foreground w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="border-border hover:bg-muted/30">
              <TableCell>
                <Link 
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-3 hover:opacity-80"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-primary">
                      {getInitials(lead.first_name, lead.last_name)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {lead.first_name} {lead.last_name}
                      </p>
                      {lead.lead_score >= 70 && (
                        <Flame className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                {lead.company ? (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{lead.company}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(lead.status)}>
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getScoreColor(lead.lead_score)}`}
                      style={{ width: `${lead.lead_score}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">{lead.lead_score}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {lead.source || '-'}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/leads/${lead.id}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    {lead.email && (
                      <DropdownMenuItem>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                    )}
                    {lead.phone && (
                      <DropdownMenuItem>
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.[0] || ''
  const last = lastName?.[0] || ''
  return (first + last).toUpperCase() || '?'
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'qualified':
    case 'converted':
      return 'default'
    case 'contacted':
      return 'secondary'
    case 'unqualified':
      return 'destructive'
    default:
      return 'outline'
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-success'
  if (score >= 40) return 'bg-warning'
  return 'bg-muted-foreground'
}

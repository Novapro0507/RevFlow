'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Building, Mail, Flame } from 'lucide-react'
import Link from 'next/link'
import type { Lead } from '@/lib/types'

interface RecentLeadsProps {
  leads: Lead[]
}

export function RecentLeads({ leads }: RecentLeadsProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Recent Leads</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/leads">
            View all
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No leads yet. Start discovering potential customers.</p>
            <Button asChild>
              <Link href="/leads/discover">Discover Leads</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-primary">
                    {getInitials(lead.first_name, lead.last_name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">
                      {lead.first_name} {lead.last_name}
                    </p>
                    {lead.lead_score >= 70 && (
                      <Flame className="w-4 h-4 text-destructive flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {lead.company && (
                      <span className="flex items-center gap-1 truncate">
                        <Building className="w-3 h-3" />
                        {lead.company}
                      </span>
                    )}
                    {lead.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" />
                        {lead.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={getStatusVariant(lead.status)}>
                    {lead.status}
                  </Badge>
                  <div className="w-12 text-right">
                    <span className="text-sm font-medium text-foreground">{lead.lead_score}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
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
      return 'default'
    case 'contacted':
      return 'secondary'
    case 'converted':
      return 'default'
    case 'unqualified':
      return 'destructive'
    default:
      return 'outline'
  }
}

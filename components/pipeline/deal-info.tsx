'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import type { Deal, Lead } from '@/lib/types'

interface DealInfoProps {
  deal: Deal
  linkedLead: Lead | null
}

export function DealInfo({ deal, linkedLead }: DealInfoProps) {
  const contactInfo = [
    { icon: User, label: 'Contact', value: deal.contact_name },
    { icon: Mail, label: 'Email', value: deal.contact_email },
    { icon: Phone, label: 'Phone', value: deal.contact_phone },
    { icon: Building, label: 'Company', value: deal.company_name },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Deal Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contactInfo.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm text-foreground truncate">
                  {item.value || '-'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Linked Lead */}
        {linkedLead && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Linked Lead</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/leads/${linkedLead.id}`}>
                  View Lead
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {linkedLead.first_name?.[0]}{linkedLead.last_name?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {linkedLead.first_name} {linkedLead.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Score: {linkedLead.lead_score}/100
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {deal.notes && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium text-foreground mb-2">Notes</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {deal.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

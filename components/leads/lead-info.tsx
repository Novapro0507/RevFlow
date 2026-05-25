'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Globe, 
  Linkedin,
  Briefcase,
  Tag
} from 'lucide-react'
import type { Lead } from '@/lib/types'

interface LeadInfoProps {
  lead: Lead
}

export function LeadInfo({ lead }: LeadInfoProps) {
  const contactInfo = [
    { icon: Mail, label: 'Email', value: lead.email },
    { icon: Phone, label: 'Phone', value: lead.phone },
    { icon: Building, label: 'Company', value: lead.company },
    { icon: Briefcase, label: 'Job Title', value: lead.job_title },
    { icon: MapPin, label: 'Location', value: lead.location },
    { icon: Globe, label: 'Website', value: lead.website, isLink: true },
    { icon: Linkedin, label: 'LinkedIn', value: lead.linkedin_url, isLink: true },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contactInfo.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                {item.value ? (
                  item.isLink ? (
                    <a 
                      href={item.value.startsWith('http') ? item.value : `https://${item.value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate block"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm text-foreground truncate">{item.value}</p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">-</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {lead.tags && lead.tags.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lead.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {lead.notes && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium text-foreground mb-2">Notes</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {lead.notes}
            </p>
          </div>
        )}

        {/* Google Intent Data */}
        {(lead.google_place_id || lead.search_keywords) && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium text-foreground mb-2">Intent Signals</p>
            <div className="space-y-2">
              {lead.search_keywords && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Search Keywords: </span>
                  <span className="text-foreground">{lead.search_keywords}</span>
                </p>
              )}
              {lead.search_location && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Search Location: </span>
                  <span className="text-foreground">{lead.search_location}</span>
                </p>
              )}
              {lead.google_rating && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Google Rating: </span>
                  <span className="text-foreground">{lead.google_rating} ({lead.google_reviews_count} reviews)</span>
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ExternalLink, 
  UserPlus, 
  MapPin, 
  Phone,
  Flame,
  Search
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SearchResult {
  id: string
  monitor_id: string
  title: string | null
  snippet: string | null
  url: string | null
  position: number | null
  business_name: string | null
  business_phone: string | null
  business_address: string | null
  detected_intent: string | null
  intent_score: number
  lead_id: string | null
  found_at: string
  search_monitors?: { name: string }
}

interface SearchResultsListProps {
  results: SearchResult[]
}

export function SearchResultsList({ results }: SearchResultsListProps) {
  const router = useRouter()
  const [converting, setConverting] = useState<string | null>(null)

  const convertToLead = async (result: SearchResult) => {
    setConverting(result.id)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Parse business name for first/last name
    const nameParts = (result.business_name || 'Unknown').split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || ''

    // Create lead
    const { data: lead, error } = await supabase.from('leads').insert({
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
      company: result.business_name,
      phone: result.business_phone,
      location: result.business_address,
      website: result.url,
      lead_type: 'b2b',
      source: 'google_search',
      lead_score: Math.min(result.intent_score + 30, 100),
      intent_strength: result.intent_score,
      search_keywords: result.detected_intent,
      intent_signals: result.detected_intent ? [result.detected_intent] : [],
    }).select().single()

    if (!error && lead) {
      // Link result to lead
      await supabase
        .from('search_results')
        .update({ lead_id: lead.id })
        .eq('id', result.id)
    }

    setConverting(null)
    router.refresh()
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Search Results</CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No results yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Create a search monitor and run a scan to start discovering leads actively searching for your services.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="p-4 rounded-lg bg-muted/30 border border-border"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {result.intent_score >= 70 && (
                        <Flame className="w-4 h-4 text-destructive flex-shrink-0" />
                      )}
                      <h4 className="font-medium text-foreground truncate">
                        {result.business_name || result.title || 'Unknown'}
                      </h4>
                      <Badge 
                        variant={result.intent_score >= 70 ? 'default' : 'secondary'}
                        className="flex-shrink-0"
                      >
                        {result.intent_score}% intent
                      </Badge>
                    </div>

                    {result.snippet && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {result.snippet}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {result.business_address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {result.business_address}
                        </span>
                      )}
                      {result.business_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {result.business_phone}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {result.search_monitors && (
                        <span>From: {result.search_monitors.name}</span>
                      )}
                      <span>
                        Found {formatDistanceToNow(new Date(result.found_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {result.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {result.lead_id ? (
                      <Badge variant="secondary">Converted</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => convertToLead(result)}
                        disabled={converting === result.id}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        {converting === result.id ? 'Converting...' : 'Add Lead'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

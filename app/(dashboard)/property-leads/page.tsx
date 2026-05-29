'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Upload, 
  Search, 
  Building2, 
  DollarSign, 
  Calendar, 
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Bot,
  Filter,
  Download,
  RefreshCw,
  Home,
  Gauge,
  Target,
  TrendingUp
} from 'lucide-react'

interface PropertyLead {
  id: string
  full_address: string
  city: string
  state: string
  zip_code: string
  owner_name: string
  home_value: number
  year_built: number
  last_sale_date: string
  property_type: string
  exterior_condition_score: number
  ai_service_recommendation: string
  lead_score: number
  estimated_ticket: number
  outreach_status: string
  email: string
  phone: string
  created_at: string
}

export default function PropertyLeadsPage() {
  const [properties, setProperties] = useState<PropertyLead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [importing, setImporting] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    notContacted: 0,
    avgLeadScore: 0,
    totalPipelineValue: 0,
  })

  const supabase = createClient()

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('property_leads')
      .select('*')
      .eq('user_id', user.id)
      .order('lead_score', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('outreach_status', statusFilter)
    }

    if (searchTerm) {
      query = query.or(`full_address.ilike.%${searchTerm}%,owner_name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,zip_code.ilike.%${searchTerm}%`)
    }

    const { data } = await query.limit(100)
    setProperties(data || [])

    // Calculate stats
    if (data) {
      const notContacted = data.filter(p => p.outreach_status === 'not_contacted').length
      const avgScore = data.length ? Math.round(data.reduce((sum, p) => sum + (p.lead_score || 0), 0) / data.length) : 0
      const pipelineValue = data
        .filter(p => p.outreach_status === 'quote_sent')
        .reduce((sum, p) => sum + (p.estimated_ticket || 0), 0)

      setStats({
        total: data.length,
        notContacted,
        avgLeadScore: avgScore,
        totalPipelineValue: pipelineValue,
      })
    }

    setLoading(false)
  }, [supabase, statusFilter, searchTerm])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setImporting(false)
      return
    }

    const text = await file.text()
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))

    const propertiesToInsert = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const row: Record<string, string | number | null> = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || null
      })

      // Map CSV columns to database columns
      const property = {
        user_id: user.id,
        full_address: row.full_address || row.address || '',
        city: row.city || '',
        state: row.state || '',
        zip_code: String(row.zip_code || row.zipcode || row.zip || ''),
        owner_name: row.owner_name || row.owner || '',
        home_value: row.home_value ? Number(row.home_value) : null,
        year_built: row.year_built ? Number(row.year_built) : null,
        last_sale_date: row.last_sale_date || null,
        property_type: mapPropertyType(String(row.property_type || '')),
        exterior_condition_score: row.exterior_condition_score ? Number(row.exterior_condition_score) : null,
        ai_service_recommendation: row.ai_service_recommendation || '',
        lead_score: row.lead_score ? Number(row.lead_score) : calculateLeadScore(row),
        estimated_ticket: row.estimated_ticket ? Number(row.estimated_ticket) : null,
        outreach_status: row.outreach_status || 'not_contacted',
        email: row.email || '',
        phone: row.phone || '',
        data_sources: ['csv_import'],
      }

      propertiesToInsert.push(property)
    }

    if (propertiesToInsert.length > 0) {
      const { error } = await supabase
        .from('property_leads')
        .insert(propertiesToInsert)

      if (error) {
        console.error('Import error:', error)
        alert(`Error importing: ${error.message}`)
      } else {
        alert(`Successfully imported ${propertiesToInsert.length} properties!`)
        setImportDialogOpen(false)
        fetchProperties()
      }
    }

    setImporting(false)
    event.target.value = ''
  }

  const mapPropertyType = (type: string): string => {
    const lower = type.toLowerCase()
    if (lower.includes('single') || lower.includes('sfr')) return 'single_family'
    if (lower.includes('multi')) return 'multi_family'
    if (lower.includes('condo')) return 'condo'
    if (lower.includes('town')) return 'townhouse'
    if (lower.includes('commercial')) return 'commercial'
    if (lower.includes('land')) return 'land'
    return 'other'
  }

  const calculateLeadScore = (row: Record<string, string | number | null>): number => {
    let score = 50 // Base score

    // Older homes need more work
    const yearBuilt = Number(row.year_built)
    if (yearBuilt && yearBuilt < 1990) score += 15
    else if (yearBuilt && yearBuilt < 2000) score += 10

    // Lower condition = higher opportunity
    const condition = Number(row.exterior_condition_score)
    if (condition && condition < 40) score += 20
    else if (condition && condition < 60) score += 10

    // Higher home value = can afford services
    const value = Number(row.home_value)
    if (value && value > 500000) score += 10
    else if (value && value > 300000) score += 5

    return Math.min(100, Math.max(0, score))
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      not_contacted: 'bg-muted text-muted-foreground',
      contacted: 'bg-blue-500/20 text-blue-400',
      callback_scheduled: 'bg-amber-500/20 text-amber-400',
      quote_sent: 'bg-purple-500/20 text-purple-400',
      won: 'bg-green-500/20 text-green-400',
      lost: 'bg-red-500/20 text-red-400',
      not_interested: 'bg-muted text-muted-foreground',
    }
    return colors[status] || 'bg-muted text-muted-foreground'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-muted-foreground'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Home className="w-6 h-6 text-primary" />
            Property Leads
          </h1>
          <p className="text-muted-foreground">
            Property data from county records, Zillow, and Google Maps
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchProperties}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Property Data</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with property data. Expected columns:
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg font-mono text-xs">
                  Full Address, City, Zip Code, Owner Name, Home Value, Year Built, Last Sale Date, Property Type, Exterior Condition Score, AI Service Recommendation, Lead Score, Estimated Ticket, Outreach Status, Email, Phone
                </div>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    className="hidden"
                    id="csv-upload"
                    disabled={importing}
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {importing ? 'Importing...' : 'Click to upload CSV file'}
                    </p>
                  </label>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="secondary" asChild>
            <a href="/ai/lead-finder">
              <Bot className="w-4 h-4 mr-2" />
              AI Lead Finder
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Properties</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Target className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.notContacted}</p>
                <p className="text-xs text-muted-foreground">Not Contacted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Gauge className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.avgLeadScore}</p>
                <p className="text-xs text-muted-foreground">Avg Lead Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">${stats.totalPipelineValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search address, owner, city, ZIP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not_contacted">Not Contacted</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="callback_scheduled">Callback Scheduled</SelectItem>
                <SelectItem value="quote_sent">Quote Sent</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Home className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Property Leads Yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Import property data via CSV to start finding homeowners who need your services.
              </p>
              <Button onClick={() => setImportDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-[250px]">Address</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Home Value</TableHead>
                    <TableHead className="text-center">Year Built</TableHead>
                    <TableHead className="text-center">Condition</TableHead>
                    <TableHead className="text-center">Lead Score</TableHead>
                    <TableHead className="text-right">Est. Ticket</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => (
                    <TableRow key={property.id} className="border-border">
                      <TableCell>
                        <div className="font-medium">{property.full_address}</div>
                        <div className="text-xs text-muted-foreground">
                          {property.city}, {property.state} {property.zip_code}
                        </div>
                      </TableCell>
                      <TableCell>{property.owner_name || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {property.home_value 
                          ? `$${property.home_value.toLocaleString()}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">{property.year_built || '-'}</TableCell>
                      <TableCell className="text-center">
                        {property.exterior_condition_score !== null ? (
                          <span className={property.exterior_condition_score < 50 ? 'text-red-400' : 'text-green-400'}>
                            {property.exterior_condition_score}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${getScoreColor(property.lead_score)}`}>
                          {property.lead_score}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {property.estimated_ticket 
                          ? `$${property.estimated_ticket.toLocaleString()}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(property.outreach_status)}>
                          {property.outreach_status?.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {property.phone && (
                            <a href={`tel:${property.phone}`} className="text-muted-foreground hover:text-foreground">
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          {property.email && (
                            <a href={`mailto:${property.email}`} className="text-muted-foreground hover:text-foreground">
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

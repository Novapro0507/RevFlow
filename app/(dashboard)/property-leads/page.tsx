'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Upload, 
  Search, 
  DollarSign, 
  MapPin,
  Phone,
  Mail,
  Bot,
  RefreshCw,
  Home,
  Target,
  Zap,
  Loader2,
  CheckCircle,
  AlertCircle,
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
  updated_at: string
  square_footage: number
  bedrooms: number
  bathrooms: number
}

export default function PropertyLeadsPage() {
  const [properties, setProperties] = useState<PropertyLead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importTab, setImportTab] = useState('zip')
  const [importStatus, setImportStatus] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error'
    message?: string
  }>({ status: 'idle' })
  
  // Import form state
  const [zipCode, setZipCode] = useState('')
  const [address, setAddress] = useState('')
  const [importLimit, setImportLimit] = useState('50')
  const [enrichingId, setEnrichingId] = useState<string | null>(null)

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

  // Import by ZIP code
  const handleZipImport = async () => {
    if (!zipCode.trim()) return
    
    setImportStatus({ status: 'loading', message: 'Fetching property data...' })

    try {
      const response = await fetch('/api/property/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'zip',
          zipCode: zipCode.trim(),
          limit: parseInt(importLimit) || 50,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setImportStatus({
          status: 'success',
          message: result.message,
        })
        fetchProperties()
        setZipCode('')
      } else {
        setImportStatus({
          status: 'error',
          message: result.error || 'Import failed',
        })
      }
    } catch (error) {
      setImportStatus({
        status: 'error',
        message: 'Network error. Please try again.',
      })
    }
  }

  // Import by address
  const handleAddressImport = async () => {
    if (!address.trim()) return
    
    setImportStatus({ status: 'loading', message: 'Looking up property...' })

    try {
      const response = await fetch('/api/property/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'address',
          address: address.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setImportStatus({
          status: 'success',
          message: result.message,
        })
        fetchProperties()
        setAddress('')
      } else {
        setImportStatus({
          status: 'error',
          message: result.error || 'Property not found',
        })
      }
    } catch (error) {
      setImportStatus({
        status: 'error',
        message: 'Network error. Please try again.',
      })
    }
  }

  // Enrich single property
  const handleEnrichProperty = async (propertyId: string) => {
    setEnrichingId(propertyId)

    try {
      const response = await fetch(`/api/property/import?id=${propertyId}`, {
        method: 'GET',
      })

      const result = await response.json()
      
      if (result.success) {
        fetchProperties()
      }
    } catch (error) {
      console.error('Enrich failed:', error)
    }

    setEnrichingId(null)
  }

  // Update outreach status
  const handleStatusUpdate = async (propertyId: string, newStatus: string) => {
    const { error } = await supabase
      .from('property_leads')
      .update({ 
        outreach_status: newStatus,
        last_contacted_at: newStatus !== 'not_contacted' ? new Date().toISOString() : null,
      })
      .eq('id', propertyId)

    if (!error) {
      fetchProperties()
    }
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
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
            Property data powered by RealtyMole API
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchProperties}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <a href="/ai/lead-finder">
              <Bot className="w-4 h-4 mr-2" />
              AI Lead Finder
            </a>
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <MapPin className="w-4 h-4 mr-2" />
                Import Properties
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Import Property Data</DialogTitle>
                <DialogDescription>
                  Fetch property data from RealtyMole by ZIP code or address
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={importTab} onValueChange={setImportTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="zip">By ZIP Code</TabsTrigger>
                  <TabsTrigger value="address">By Address</TabsTrigger>
                </TabsList>
                
                <TabsContent value="zip" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div>
                      <Label>ZIP Code</Label>
                      <Input 
                        placeholder="e.g. 90210"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Max Properties</Label>
                      <Select value={importLimit} onValueChange={setImportLimit}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 properties</SelectItem>
                          <SelectItem value="50">50 properties</SelectItem>
                          <SelectItem value="100">100 properties</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {importStatus.status !== 'idle' && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 ${
                      importStatus.status === 'loading' ? 'bg-blue-500/10 text-blue-400' :
                      importStatus.status === 'success' ? 'bg-green-500/10 text-green-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {importStatus.status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                      {importStatus.status === 'success' && <CheckCircle className="w-4 h-4" />}
                      {importStatus.status === 'error' && <AlertCircle className="w-4 h-4" />}
                      <span className="text-sm">{importStatus.message}</span>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full" 
                    onClick={handleZipImport}
                    disabled={importStatus.status === 'loading' || !zipCode.trim()}
                  >
                    {importStatus.status === 'loading' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Fetch Properties
                  </Button>
                </TabsContent>
                
                <TabsContent value="address" className="space-y-4 mt-4">
                  <div>
                    <Label>Full Address</Label>
                    <Textarea 
                      placeholder="123 Main St, Beverly Hills, CA 90210"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the complete address including city, state, and ZIP
                    </p>
                  </div>
                  
                  {importStatus.status !== 'idle' && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 ${
                      importStatus.status === 'loading' ? 'bg-blue-500/10 text-blue-400' :
                      importStatus.status === 'success' ? 'bg-green-500/10 text-green-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {importStatus.status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                      {importStatus.status === 'success' && <CheckCircle className="w-4 h-4" />}
                      {importStatus.status === 'error' && <AlertCircle className="w-4 h-4" />}
                      <span className="text-sm">{importStatus.message}</span>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full" 
                    onClick={handleAddressImport}
                    disabled={importStatus.status === 'loading' || !address.trim()}
                  >
                    {importStatus.status === 'loading' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Lookup Property
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Home className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Properties</p>
                <p className="text-2xl font-bold font-mono">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Phone className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Not Contacted</p>
                <p className="text-2xl font-bold font-mono">{stats.notContacted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Lead Score</p>
                <p className="text-2xl font-bold font-mono">{stats.avgLeadScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold font-mono">{formatCurrency(stats.totalPipelineValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by address, owner, city, or ZIP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
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

      {/* Properties Table */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Property Database</CardTitle>
          <CardDescription>
            {properties.length} properties loaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <Home className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No properties yet</h3>
              <p className="text-muted-foreground mb-4">
                Import properties by ZIP code to get started
              </p>
              <Button onClick={() => setImportDialogOpen(true)}>
                <MapPin className="w-4 h-4 mr-2" />
                Import Properties
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Address</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-center">Year</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-right">Est. Ticket</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => (
                    <TableRow key={property.id} className="group">
                      <TableCell>
                        <div>
                          <p className="font-medium">{property.full_address}</p>
                          <p className="text-sm text-muted-foreground">
                            {property.city}, {property.state} {property.zip_code}
                          </p>
                          {property.square_footage && (
                            <p className="text-xs text-muted-foreground">
                              {property.square_footage.toLocaleString()} sqft
                              {property.bedrooms && ` · ${property.bedrooms} bed`}
                              {property.bathrooms && ` · ${property.bathrooms} bath`}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{property.owner_name || '-'}</p>
                          {property.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {property.phone}
                            </p>
                          )}
                          {property.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {property.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {property.home_value ? formatCurrency(property.home_value) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {property.year_built || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold font-mono ${getScoreColor(property.lead_score || 0)}`}>
                          {property.lead_score || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {property.estimated_ticket ? formatCurrency(property.estimated_ticket) : '-'}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={property.outreach_status} 
                          onValueChange={(value) => handleStatusUpdate(property.id, value)}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <Badge className={getStatusBadge(property.outreach_status)}>
                              {property.outreach_status.replace('_', ' ')}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_contacted">Not Contacted</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="callback_scheduled">Callback Scheduled</SelectItem>
                            <SelectItem value="quote_sent">Quote Sent</SelectItem>
                            <SelectItem value="won">Won</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                            <SelectItem value="not_interested">Not Interested</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEnrichProperty(property.id)}
                          disabled={enrichingId === property.id}
                          title="Refresh property data"
                        >
                          {enrichingId === property.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </Button>
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

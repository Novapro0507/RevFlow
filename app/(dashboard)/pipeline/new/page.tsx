'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { ArrowLeft } from 'lucide-react'
import type { Pipeline, Lead } from '@/lib/types'

export default function NewDealPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])

  const [formData, setFormData] = useState({
    title: '',
    value: '',
    currency: 'USD',
    stage: 'lead',
    expected_close_date: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    company_name: '',
    lead_id: '',
    notes: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      // Get default pipeline
      const { data: pipelineData } = await supabase
        .from('pipelines')
        .select('*')
        .eq('is_default', true)
        .single()
      
      if (pipelineData) {
        setPipeline(pipelineData)
      }

      // Get leads to link
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .in('status', ['new', 'contacted', 'qualified'])
        .order('lead_score', { ascending: false })
        .limit(50)
      
      setLeads(leadsData || [])
    }

    fetchData()
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (lead) {
      setFormData(prev => ({
        ...prev,
        lead_id: leadId,
        contact_name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
        contact_email: lead.email || '',
        contact_phone: lead.phone || '',
        company_name: lead.company || '',
        title: lead.company ? `Deal with ${lead.company}` : `Deal with ${lead.first_name || 'Lead'}`,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !pipeline) {
      setError('Unable to create deal')
      setLoading(false)
      return
    }

    const probability = getStageProbability(formData.stage)

    const { error: insertError } = await supabase.from('deals').insert({
      user_id: user.id,
      pipeline_id: pipeline.id,
      title: formData.title,
      value: parseFloat(formData.value) || 0,
      currency: formData.currency,
      stage: formData.stage,
      probability,
      expected_close_date: formData.expected_close_date || null,
      contact_name: formData.contact_name || null,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      company_name: formData.company_name || null,
      lead_id: formData.lead_id || null,
      notes: formData.notes || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // If linked to a lead, update lead status
    if (formData.lead_id) {
      await supabase
        .from('leads')
        .update({ status: 'converted' })
        .eq('id', formData.lead_id)
    }

    router.push('/pipeline')
    router.refresh()
  }

  const stages = (pipeline?.stages as { id: string; name: string }[]) || []

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/pipeline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pipeline
        </Link>
      </Button>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Create New Deal</CardTitle>
          <CardDescription className="text-muted-foreground">
            Add a new deal to your pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Link to Lead */}
            {leads.length > 0 && (
              <Field>
                <FieldLabel>Link to Lead (Optional)</FieldLabel>
                <Select
                  value={formData.lead_id}
                  onValueChange={handleLeadSelect}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select a lead to link" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.first_name} {lead.last_name} 
                        {lead.company ? ` - ${lead.company}` : ''}
                        {` (Score: ${lead.lead_score})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {/* Deal Info */}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">Deal Title *</FieldLabel>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Enterprise Software Deal"
                  required
                  className="bg-input border-border"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="value">Deal Value *</FieldLabel>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => handleChange('value', e.target.value)}
                    placeholder="10000"
                    required
                    className="bg-input border-border"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="currency">Currency</FieldLabel>
                  <Select
                    value={formData.currency}
                    onValueChange={(v) => handleChange('currency', v)}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="stage">Stage</FieldLabel>
                  <Select
                    value={formData.stage}
                    onValueChange={(v) => handleChange('stage', v)}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="expected_close_date">Expected Close</FieldLabel>
                  <Input
                    id="expected_close_date"
                    type="date"
                    value={formData.expected_close_date}
                    onChange={(e) => handleChange('expected_close_date', e.target.value)}
                    className="bg-input border-border"
                  />
                </Field>
              </div>
            </FieldGroup>

            {/* Contact Info */}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="company_name">Company</FieldLabel>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="bg-input border-border"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="contact_name">Contact Name</FieldLabel>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => handleChange('contact_name', e.target.value)}
                  className="bg-input border-border"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="contact_email">Contact Email</FieldLabel>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    className="bg-input border-border"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="contact_phone">Contact Phone</FieldLabel>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    className="bg-input border-border"
                  />
                </Field>
              </div>
            </FieldGroup>

            {/* Notes */}
            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                placeholder="Any notes about this deal..."
                className="bg-input border-border"
              />
            </Field>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link href="/pipeline">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Spinner className="mr-2" />}
                {loading ? 'Creating...' : 'Create Deal'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function getStageProbability(stageId: string): number {
  const probabilities: Record<string, number> = {
    lead: 10,
    contacted: 20,
    qualified: 40,
    proposal: 60,
    negotiation: 80,
    closed_won: 100,
    closed_lost: 0,
  }
  return probabilities[stageId] || 10
}

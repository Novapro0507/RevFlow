'use client'

import { useState } from 'react'
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

export default function NewLeadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    industry: '',
    location: '',
    website: '',
    linkedin_url: '',
    lead_type: 'b2b' as 'b2b' | 'b2c',
    source: '',
    notes: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    // Calculate initial lead score based on data completeness
    let leadScore = 20 // Base score
    if (formData.email) leadScore += 20
    if (formData.phone) leadScore += 10
    if (formData.company) leadScore += 15
    if (formData.job_title) leadScore += 10
    if (formData.linkedin_url) leadScore += 10
    if (formData.website) leadScore += 5
    leadScore = Math.min(leadScore, 100)

    const { error: insertError } = await supabase.from('leads').insert({
      user_id: user.id,
      ...formData,
      lead_score: leadScore,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/leads')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/leads">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </Link>
      </Button>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Add New Lead</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter the details of your new lead
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="first_name">First Name *</FieldLabel>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="last_name">Last Name *</FieldLabel>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="bg-input border-border"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="bg-input border-border"
                />
              </Field>
            </FieldGroup>

            {/* Company Info */}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="company">Company</FieldLabel>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  className="bg-input border-border"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="job_title">Job Title</FieldLabel>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => handleChange('job_title', e.target.value)}
                    className="bg-input border-border"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="industry">Industry</FieldLabel>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleChange('industry', e.target.value)}
                    className="bg-input border-border"
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="location">Location</FieldLabel>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="City, State/Country"
                  className="bg-input border-border"
                />
              </Field>
            </FieldGroup>

            {/* Online Presence */}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="website">Website</FieldLabel>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://example.com"
                  className="bg-input border-border"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="linkedin_url">LinkedIn URL</FieldLabel>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="bg-input border-border"
                />
              </Field>
            </FieldGroup>

            {/* Classification */}
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="lead_type">Lead Type</FieldLabel>
                  <Select
                    value={formData.lead_type}
                    onValueChange={(value) => handleChange('lead_type', value)}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="b2b">B2B</SelectItem>
                      <SelectItem value="b2c">B2C</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="source">Source</FieldLabel>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => handleChange('source', value)}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Entry</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="apollo">Apollo.io</SelectItem>
                      <SelectItem value="google">Google Search</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                placeholder="Any additional notes about this lead..."
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
                <Link href="/leads">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Spinner className="mr-2" />}
                {loading ? 'Creating...' : 'Create Lead'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

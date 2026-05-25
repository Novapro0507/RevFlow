'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
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
import { Search, MapPin, Plus, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { SearchMonitor } from '@/lib/types'

interface MonitorsListProps {
  monitors: SearchMonitor[]
}

export function MonitorsList({ monitors }: MonitorsListProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
    location: '',
    radius_miles: '25',
    service_category: '',
    run_frequency: 'daily' as 'hourly' | 'daily' | 'weekly',
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from('search_monitors').insert({
      user_id: user.id,
      name: formData.name,
      keywords: formData.keywords.split(',').map(k => k.trim()),
      location: formData.location,
      radius_miles: parseInt(formData.radius_miles),
      service_category: formData.service_category || null,
      run_frequency: formData.run_frequency,
    })

    setOpen(false)
    setLoading(false)
    setFormData({
      name: '',
      keywords: '',
      location: '',
      radius_miles: '25',
      service_category: '',
      run_frequency: 'daily',
    })
    router.refresh()
  }

  const toggleMonitor = async (id: string, isActive: boolean) => {
    const supabase = createClient()
    await supabase
      .from('search_monitors')
      .update({ is_active: !isActive })
      .eq('id', id)
    router.refresh()
  }

  const deleteMonitor = async (id: string) => {
    if (!confirm('Delete this monitor?')) return
    const supabase = createClient()
    await supabase.from('search_monitors').delete().eq('id', id)
    router.refresh()
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Search Monitors</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Search Monitor</DialogTitle>
              <DialogDescription>
                Set up keyword monitoring to find leads actively searching for your services
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Monitor Name</FieldLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g., Marketing Agency Leads"
                    required
                    className="bg-input border-border"
                  />
                </Field>
                <Field>
                  <FieldLabel>Keywords (comma separated)</FieldLabel>
                  <Input
                    value={formData.keywords}
                    onChange={(e) => setFormData(f => ({ ...f, keywords: e.target.value }))}
                    placeholder="e.g., marketing agency, digital marketing"
                    required
                    className="bg-input border-border"
                  />
                </Field>
                <Field>
                  <FieldLabel>Location</FieldLabel>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g., Austin, Texas"
                    required
                    className="bg-input border-border"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Radius (miles)</FieldLabel>
                    <Select
                      value={formData.radius_miles}
                      onValueChange={(v) => setFormData(f => ({ ...f, radius_miles: v }))}
                    >
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 miles</SelectItem>
                        <SelectItem value="25">25 miles</SelectItem>
                        <SelectItem value="50">50 miles</SelectItem>
                        <SelectItem value="100">100 miles</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Frequency</FieldLabel>
                    <Select
                      value={formData.run_frequency}
                      onValueChange={(v) => setFormData(f => ({ ...f, run_frequency: v as 'hourly' | 'daily' | 'weekly' }))}
                    >
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Monitor'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {monitors.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No monitors set up yet</p>
            <p className="text-sm text-muted-foreground">
              Create a monitor to start finding hot leads
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {monitors.map((monitor) => (
              <div
                key={monitor.id}
                className="p-3 rounded-lg bg-muted/30 border border-border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{monitor.name}</span>
                  <Switch
                    checked={monitor.is_active}
                    onCheckedChange={() => toggleMonitor(monitor.id, monitor.is_active)}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {monitor.location} ({monitor.radius_miles}mi)
                </div>
                <div className="flex flex-wrap gap-1">
                  {monitor.keywords.slice(0, 3).map((kw) => (
                    <Badge key={kw} variant="secondary" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                  {monitor.keywords.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{monitor.keywords.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {monitor.last_run_at
                      ? `Last run ${formatDistanceToNow(new Date(monitor.last_run_at), { addSuffix: true })}`
                      : 'Never run'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => deleteMonitor(monitor.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

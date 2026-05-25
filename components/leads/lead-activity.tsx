'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  CheckSquare,
  MoreHorizontal
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Activity } from '@/lib/types'

interface LeadActivityProps {
  activities: Activity[]
  leadId: string
}

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  task: CheckSquare,
  other: MoreHorizontal,
}

const activityColors = {
  call: 'bg-success/10 text-success',
  email: 'bg-primary/10 text-primary',
  meeting: 'bg-warning/10 text-warning',
  note: 'bg-muted text-muted-foreground',
  task: 'bg-info/10 text-info',
  other: 'bg-muted text-muted-foreground',
}

export function LeadActivity({ activities, leadId }: LeadActivityProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [activityType, setActivityType] = useState<Activity['type']>('note')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from('activities').insert({
      user_id: user.id,
      lead_id: leadId,
      type: activityType,
      title: title.trim(),
      description: description.trim() || null,
    })

    setTitle('')
    setDescription('')
    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Activity</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Activity
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
            <div className="flex items-center gap-3">
              <Select
                value={activityType}
                onValueChange={(value) => setActivityType(value as Activity['type'])}
              >
                <SelectTrigger className="w-32 bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Activity title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 bg-input border-border"
              />
            </div>
            <Textarea
              placeholder="Add details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="bg-input border-border"
            />
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !title.trim()}>
                {loading ? 'Saving...' : 'Save Activity'}
              </Button>
            </div>
          </form>
        )}

        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No activities yet. Log your first interaction.
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type]
              const colorClass = activityColors[activity.type]
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {activity.title}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

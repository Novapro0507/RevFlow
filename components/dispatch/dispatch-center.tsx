'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Truck,
  Plus,
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle,
  AlertCircle,
  Calendar,
  Filter,
  Search,
  Radio,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Job {
  id: string
  title: string
  description?: string
  job_type?: string
  client_name: string
  client_phone?: string
  client_email?: string
  address: string
  city?: string
  state?: string
  zip_code?: string
  scheduled_date?: string
  scheduled_time?: string
  estimated_duration?: number
  status: string
  priority: string
  assigned_to?: string
  notes?: string
  created_at: string
}

interface TeamMember {
  id: string
  name: string
  email?: string
  phone?: string
  role: string
  specialties?: string[]
  avatar_url?: string
}

interface DispatchCenterProps {
  initialJobs: Job[]
  teamMembers: TeamMember[]
  userId: string
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  scheduled: { label: 'Scheduled', color: 'bg-info/10 text-info border-info/20', icon: Calendar },
  in_progress: { label: 'In Progress', color: 'bg-primary/10 text-primary border-primary/20', icon: Truck },
  completed: { label: 'Completed', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground border-border', icon: AlertCircle },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normal', color: 'bg-info/10 text-info' },
  high: { label: 'High', color: 'bg-warning/10 text-warning' },
  urgent: { label: 'Urgent', color: 'bg-destructive/10 text-destructive animate-pulse' },
}

export function DispatchCenter({ initialJobs, teamMembers, userId }: DispatchCenterProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const filteredJobs = jobs.filter((job) => {
    const matchesFilter = filter === 'all' || job.status === filter
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.address.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    pending: jobs.filter((j) => j.status === 'pending').length,
    scheduled: jobs.filter((j) => j.status === 'scheduled').length,
    inProgress: jobs.filter((j) => j.status === 'in_progress').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
  }

  const handleCreateJob = async (formData: FormData) => {
    const supabase = createClient()
    
    const newJob = {
      user_id: userId,
      title: formData.get('title') as string,
      client_name: formData.get('client_name') as string,
      client_phone: formData.get('client_phone') as string,
      address: formData.get('address') as string,
      scheduled_date: formData.get('scheduled_date') as string,
      scheduled_time: formData.get('scheduled_time') as string,
      priority: formData.get('priority') as string || 'normal',
      assigned_to: formData.get('assigned_to') as string || null,
      notes: formData.get('notes') as string,
      status: 'scheduled',
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert([newJob])
      .select()
      .single()

    if (!error && data) {
      setJobs([...jobs, data])
      setIsCreateOpen(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center border border-primary/20">
            <Truck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Dispatch Center</h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
                <Radio className="w-3 h-3 text-success animate-pulse" />
                <span className="text-[10px] font-mono text-success uppercase tracking-wider">Live</span>
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 font-mono text-sm">
              {jobs.length} total jobs | {stats.inProgress} active
            </p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(234,88,12,0.2)]">
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Create New Job
              </DialogTitle>
              <DialogDescription>
                Schedule a new job and assign it to a team member
              </DialogDescription>
            </DialogHeader>
            <CreateJobForm 
              onSubmit={handleCreateJob}
              onClose={() => setIsCreateOpen(false)} 
              teamMembers={teamMembers}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'PENDING', value: stats.pending, icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/20' },
          { label: 'SCHEDULED', value: stats.scheduled, icon: Calendar, color: 'text-info', bgColor: 'bg-info/10', borderColor: 'border-info/20' },
          { label: 'IN PROGRESS', value: stats.inProgress, icon: Truck, color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/20', pulse: true },
          { label: 'COMPLETED', value: stats.completed, icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/20' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border hover:border-primary/30 transition-all group">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border', stat.bgColor, stat.borderColor)}>
                  <stat.icon className={cn('w-5 h-5', stat.color, stat.pulse && 'animate-pulse')} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] font-mono text-muted-foreground tracking-wider">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, clients, addresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input border-border font-mono text-sm"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-input border-border">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <Truck className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">No jobs found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || filter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Create your first job to get started'}
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} teamMembers={teamMembers} />
          ))
        )}
      </div>
    </div>
  )
}

function JobCard({ job, teamMembers }: { job: Job; teamMembers: TeamMember[] }) {
  const status = statusConfig[job.status] || statusConfig.pending
  const priority = priorityConfig[job.priority] || priorityConfig.normal
  const assignedMember = teamMembers.find(m => m.id === job.assigned_to)
  const StatusIcon = status.icon

  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-all group">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Status indicator */}
          <div className={cn('hidden lg:flex w-10 h-10 rounded-lg items-center justify-center border', status.color)}>
            <StatusIcon className="w-5 h-5" />
          </div>

          {/* Main info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-foreground">{job.title}</h3>
              <Badge variant="outline" className={cn('font-mono text-[10px] tracking-wider uppercase', status.color)}>
                {status.label}
              </Badge>
              <Badge variant="outline" className={cn('font-mono text-[10px] tracking-wider uppercase', priority.color)}>
                {priority.label}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 font-mono">
                <User className="w-4 h-4" />
                {job.client_name}
              </span>
              {job.client_phone && (
                <span className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-4 h-4" />
                  {job.client_phone}
                </span>
              )}
            </div>
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="font-mono text-xs">{job.address}</span>
            </div>
          </div>

          {/* Schedule & Assignment */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
            {job.scheduled_date && (
              <div className="text-sm">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Scheduled</p>
                <p className="font-medium text-foreground font-mono">
                  {new Date(job.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {job.scheduled_time && ` @ ${job.scheduled_time}`}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              {assignedMember ? (
                <>
                  <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {assignedMember.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{assignedMember.name}</span>
                </>
              ) : (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 font-mono text-[10px]">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Unassigned
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {job.notes && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground font-mono">
              <span className="text-foreground">Note:</span> {job.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CreateJobForm({ onSubmit, onClose, teamMembers }: { 
  onSubmit: (formData: FormData) => void
  onClose: () => void
  teamMembers: TeamMember[] 
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Job Title</label>
        <Input name="title" placeholder="e.g., HVAC Installation" className="bg-input border-border" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Client Name</label>
          <Input name="client_name" placeholder="Client name" className="bg-input border-border" required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Phone</label>
          <Input name="client_phone" placeholder="(555) 123-4567" className="bg-input border-border" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Address</label>
        <Input name="address" placeholder="Full address" className="bg-input border-border" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Date</label>
          <Input name="scheduled_date" type="date" className="bg-input border-border" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Time</label>
          <Input name="scheduled_time" type="time" className="bg-input border-border" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Assign To</label>
          <Select name="assigned_to">
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Priority</label>
          <Select name="priority" defaultValue="normal">
            <SelectTrigger className="bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Notes</label>
        <Textarea name="notes" placeholder="Any special instructions..." className="bg-input border-border" />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          Create Job
        </Button>
      </div>
    </form>
  )
}

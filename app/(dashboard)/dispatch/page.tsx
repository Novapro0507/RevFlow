'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
} from 'lucide-react'

// Mock data for dispatch jobs
const mockJobs = [
  {
    id: '1',
    title: 'HVAC Installation',
    client: 'John Smith',
    phone: '(555) 123-4567',
    address: '123 Main St, Austin, TX 78701',
    status: 'scheduled',
    priority: 'high',
    assignedTo: 'Mike Johnson',
    scheduledDate: '2024-01-15',
    scheduledTime: '9:00 AM',
    notes: 'Customer requested morning appointment. Has a dog - ring bell.',
  },
  {
    id: '2',
    title: 'Plumbing Repair',
    client: 'Sarah Davis',
    phone: '(555) 987-6543',
    address: '456 Oak Ave, Austin, TX 78702',
    status: 'in_progress',
    priority: 'urgent',
    assignedTo: 'Tom Wilson',
    scheduledDate: '2024-01-15',
    scheduledTime: '11:30 AM',
    notes: 'Emergency leak in kitchen. Parts may need to be ordered.',
  },
  {
    id: '3',
    title: 'Electrical Inspection',
    client: 'Bob Johnson',
    phone: '(555) 456-7890',
    address: '789 Pine Rd, Austin, TX 78703',
    status: 'completed',
    priority: 'normal',
    assignedTo: 'Mike Johnson',
    scheduledDate: '2024-01-14',
    scheduledTime: '2:00 PM',
    notes: 'Annual inspection for commercial property.',
  },
  {
    id: '4',
    title: 'AC Maintenance',
    client: 'Lisa Chen',
    phone: '(555) 321-0987',
    address: '321 Elm St, Austin, TX 78704',
    status: 'pending',
    priority: 'normal',
    assignedTo: null,
    scheduledDate: '2024-01-16',
    scheduledTime: '10:00 AM',
    notes: 'Regular maintenance checkup. New customer.',
  },
]

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_progress: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-500/10 text-slate-500',
  normal: 'bg-blue-500/10 text-blue-500',
  high: 'bg-orange-500/10 text-orange-500',
  urgent: 'bg-red-500/10 text-red-500',
}

const teamMembers = ['Mike Johnson', 'Tom Wilson', 'Sarah Lee', 'James Brown']

export default function DispatchPage() {
  const [jobs, setJobs] = useState(mockJobs)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const filteredJobs = jobs.filter((job) => {
    const matchesFilter = filter === 'all' || job.status === filter
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.address.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    pending: jobs.filter((j) => j.status === 'pending').length,
    scheduled: jobs.filter((j) => j.status === 'scheduled').length,
    inProgress: jobs.filter((j) => j.status === 'in_progress').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dispatch Center</h1>
          <p className="text-muted-foreground">Manage and assign jobs to your team</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
              <DialogDescription>
                Schedule a new job and assign it to a team member
              </DialogDescription>
            </DialogHeader>
            <CreateJobForm onClose={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.scheduled}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, clients, or addresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input border-border"
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
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {filteredJobs.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No jobs found matching your criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function JobCard({ job }: { job: typeof mockJobs[0] }) {
  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Left - Main info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-foreground">{job.title}</h3>
              <Badge variant="outline" className={statusColors[job.status]}>
                {job.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className={priorityColors[job.priority]}>
                {job.priority}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {job.client}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                {job.phone}
              </span>
            </div>
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {job.address}
            </div>
          </div>

          {/* Right - Schedule & Assignment */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
            <div className="text-sm">
              <p className="text-muted-foreground">Scheduled</p>
              <p className="font-medium text-foreground">
                {job.scheduledDate} at {job.scheduledTime}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {job.assignedTo ? (
                <>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {job.assignedTo
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{job.assignedTo}</span>
                </>
              ) : (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Unassigned
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </div>
        {job.notes && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Notes:</span> {job.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CreateJobForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Job Title</label>
        <Input placeholder="e.g., HVAC Installation" className="bg-input border-border" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Client Name</label>
          <Input placeholder="Client name" className="bg-input border-border" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Phone</label>
          <Input placeholder="(555) 123-4567" className="bg-input border-border" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Address</label>
        <Input placeholder="Full address" className="bg-input border-border" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Date</label>
          <Input type="date" className="bg-input border-border" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Time</label>
          <Input type="time" className="bg-input border-border" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Assign To</label>
          <Select>
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member} value={member}>
                  {member}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Priority</label>
          <Select defaultValue="normal">
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
        <label className="text-sm font-medium text-foreground">Notes</label>
        <Textarea placeholder="Any special instructions..." className="bg-input border-border" />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Job</Button>
      </div>
    </form>
  )
}

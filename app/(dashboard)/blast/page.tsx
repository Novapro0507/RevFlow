'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
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
  Send,
  Mail,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Plus,
  Filter,
  Search,
  FileText,
  Zap,
} from 'lucide-react'

// Mock data for campaigns
const mockCampaigns = [
  {
    id: '1',
    name: 'January Promo',
    type: 'email',
    status: 'sent',
    recipients: 1250,
    delivered: 1198,
    opened: 456,
    clicked: 89,
    replied: 12,
    sentAt: '2024-01-10 9:00 AM',
  },
  {
    id: '2',
    name: 'Service Reminder',
    type: 'sms',
    status: 'sent',
    recipients: 340,
    delivered: 335,
    opened: null,
    clicked: null,
    replied: 45,
    sentAt: '2024-01-12 2:00 PM',
  },
  {
    id: '3',
    name: 'New Year Follow-up',
    type: 'email',
    status: 'scheduled',
    recipients: 2100,
    delivered: 0,
    opened: 0,
    clicked: 0,
    replied: 0,
    scheduledFor: '2024-01-16 10:00 AM',
  },
  {
    id: '4',
    name: 'Appointment Confirmation',
    type: 'sms',
    status: 'draft',
    recipients: 0,
    delivered: 0,
    opened: null,
    clicked: null,
    replied: 0,
    sentAt: null,
  },
]

// Mock contact lists
const contactLists = [
  { id: '1', name: 'All Contacts', count: 3450 },
  { id: '2', name: 'Active Customers', count: 1250 },
  { id: '3', name: 'Leads - Hot', count: 89 },
  { id: '4', name: 'Leads - Warm', count: 234 },
  { id: '5', name: 'Past Customers', count: 567 },
  { id: '6', name: 'Service Due', count: 156 },
]

// Mock templates
const emailTemplates = [
  { id: '1', name: 'Welcome Email', subject: 'Welcome to Our Service!' },
  { id: '2', name: 'Service Reminder', subject: 'Time for your scheduled maintenance' },
  { id: '3', name: 'Special Offer', subject: 'Exclusive offer just for you' },
  { id: '4', name: 'Follow-up', subject: 'Checking in - How can we help?' },
]

const smsTemplates = [
  { id: '1', name: 'Appointment Reminder', content: 'Hi {name}, reminder: Your appointment is tomorrow at {time}. Reply CONFIRM to confirm.' },
  { id: '2', name: 'Service Complete', content: 'Hi {name}, your service is complete! Total: ${amount}. Thank you for choosing us!' },
  { id: '3', name: 'Quick Follow-up', content: 'Hi {name}, just checking in. How was your recent service? Reply with any feedback!' },
]

const statusColors: Record<string, string> = {
  draft: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  sending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  sent: 'bg-green-500/10 text-green-500 border-green-500/20',
  failed: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function BlastCenterPage() {
  const [activeTab, setActiveTab] = useState('campaigns')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [blastType, setBlastType] = useState<'email' | 'sms'>('email')

  const totalSent = mockCampaigns.reduce((acc, c) => acc + c.delivered, 0)
  const totalOpened = mockCampaigns.reduce((acc, c) => acc + (c.opened || 0), 0)
  const totalReplied = mockCampaigns.reduce((acc, c) => acc + c.replied, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blast Center</h1>
          <p className="text-muted-foreground">Send mass emails and SMS to your contacts</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Send className="w-4 h-4 mr-2" />
              New Blast
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Blast</DialogTitle>
              <DialogDescription>
                Send an email or SMS campaign to your contacts
              </DialogDescription>
            </DialogHeader>
            <CreateBlastForm 
              blastType={blastType} 
              setBlastType={setBlastType}
              onClose={() => setIsCreateOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalSent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Messages Sent</p>
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
                <p className="text-2xl font-bold text-foreground">
                  {totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Open Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalReplied}</p>
                <p className="text-xs text-muted-foreground">Replies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {contactLists[0].count.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="lists">Contact Lists</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                className="pl-10 bg-input border-border"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-40 bg-input border-border">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {mockCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Templates
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {emailTemplates.map((template) => (
                <Card key={template.id} className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{template.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{template.subject}</p>
                      </div>
                      <Button variant="ghost" size="sm">Use</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="bg-card border-border border-dashed hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-center h-full min-h-[80px]">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Plus className="w-4 h-4" />
                    <span>Create Template</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              SMS Templates
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {smsTemplates.map((template) => (
                <Card key={template.id} className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-2">
                        <p className="font-medium text-foreground">{template.name}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.content}</p>
                      </div>
                      <Button variant="ghost" size="sm">Use</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="bg-card border-border border-dashed hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-center h-full min-h-[80px]">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Plus className="w-4 h-4" />
                    <span>Create Template</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="lists" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">Manage your contact lists for targeted campaigns</p>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create List
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contactLists.map((list) => (
              <Card key={list.id} className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{list.name}</p>
                        <p className="text-sm text-muted-foreground">{list.count.toLocaleString()} contacts</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CampaignCard({ campaign }: { campaign: typeof mockCampaigns[0] }) {
  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                campaign.type === 'email' ? 'bg-blue-500/10' : 'bg-green-500/10'
              }`}>
                {campaign.type === 'email' ? (
                  <Mail className={`w-4 h-4 text-blue-500`} />
                ) : (
                  <MessageSquare className={`w-4 h-4 text-green-500`} />
                )}
              </div>
              <h3 className="font-semibold text-foreground">{campaign.name}</h3>
              <Badge variant="outline" className={statusColors[campaign.status]}>
                {campaign.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {campaign.recipients.toLocaleString()} recipients
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {campaign.sentAt || campaign.scheduledFor || 'Not scheduled'}
              </span>
            </div>
          </div>

          {campaign.status === 'sent' && (
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{campaign.delivered.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
              {campaign.opened !== null && (
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">
                    {Math.round((campaign.opened / campaign.delivered) * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Opened</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{campaign.replied}</p>
                <p className="text-xs text-muted-foreground">Replied</p>
              </div>
            </div>
          )}

          <Button variant="outline" size="sm">
            {campaign.status === 'draft' ? 'Edit' : 'View Details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateBlastForm({ 
  blastType, 
  setBlastType,
  onClose 
}: { 
  blastType: 'email' | 'sms'
  setBlastType: (type: 'email' | 'sms') => void
  onClose: () => void 
}) {
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [useAI, setUseAI] = useState(false)

  return (
    <form className="space-y-6">
      {/* Type Selection */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant={blastType === 'email' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setBlastType('email')}
        >
          <Mail className="w-4 h-4 mr-2" />
          Email
        </Button>
        <Button
          type="button"
          variant={blastType === 'sms' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setBlastType('sms')}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          SMS
        </Button>
      </div>

      {/* Campaign Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Campaign Name</label>
        <Input placeholder="e.g., January Newsletter" className="bg-input border-border" />
      </div>

      {/* Select Recipients */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Select Recipients</label>
        <div className="grid grid-cols-2 gap-2">
          {contactLists.map((list) => (
            <label
              key={list.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedLists.includes(list.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Checkbox
                checked={selectedLists.includes(list.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedLists([...selectedLists, list.id])
                  } else {
                    setSelectedLists(selectedLists.filter((id) => id !== list.id))
                  }
                }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{list.name}</p>
                <p className="text-xs text-muted-foreground">{list.count} contacts</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {blastType === 'email' && (
        <>
          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Subject Line</label>
            <Input placeholder="Enter email subject" className="bg-input border-border" />
          </div>

          {/* Email Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Email Content</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUseAI(!useAI)}
                className={useAI ? 'text-primary' : ''}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                AI Write
              </Button>
            </div>
            {useAI ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Describe what you want the email to say... e.g., Write a friendly email about our January promotion with 20% off all services"
                  className="bg-input border-border min-h-[100px]"
                />
                <Button type="button" variant="outline" size="sm">
                  <Zap className="w-4 h-4 mr-1" />
                  Generate Email
                </Button>
              </div>
            ) : (
              <Textarea
                placeholder="Write your email content here. Use {name}, {company}, etc. for personalization."
                className="bg-input border-border min-h-[150px]"
              />
            )}
          </div>
        </>
      )}

      {blastType === 'sms' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Message</label>
            <span className="text-xs text-muted-foreground">0/160 characters</span>
          </div>
          <Textarea
            placeholder="Write your SMS message. Use {name} for personalization."
            className="bg-input border-border"
            maxLength={160}
          />
          <p className="text-xs text-muted-foreground">
            SMS messages over 160 characters will be split into multiple messages.
          </p>
        </div>
      )}

      {/* Schedule */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">When to Send</label>
        <Select defaultValue="now">
          <SelectTrigger className="bg-input border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="now">Send Immediately</SelectItem>
            <SelectItem value="schedule">Schedule for Later</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button type="submit">
            <Send className="w-4 h-4 mr-2" />
            Send Blast
          </Button>
        </div>
      </div>
    </form>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Lightbulb, Send, Loader2, TrendingUp, Target, CalendarCheck, Sparkles, 
  User, Settings, CheckCircle2, Clock, AlertCircle, Zap
} from 'lucide-react'

export default function GrowthAssistantPage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/growth-assistant' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const [profileRes, goalsRes, tasksRes] = await Promise.all([
        supabase.from('business_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('business_goals').select('*').eq('user_id', user.id).eq('status', 'active'),
        supabase.from('weekly_tasks').select('*').eq('user_id', user.id).gte('week_of', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      ])

      setProfile(profileRes.data)
      setGoals(goalsRes.data || [])
      setTasks(tasksRes.data || [])
      setLoading(false)
    }
    loadData()
  }, [router])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const suggestedPrompts = profile?.onboarding_completed ? [
    { icon: TrendingUp, text: 'Create my weekly task list based on my goals' },
    { icon: Target, text: 'Analyze my business health and give me insights' },
    { icon: CalendarCheck, text: "What's the most important thing I should do today?" },
    { icon: Sparkles, text: 'Help me set a goal to hit my revenue target' },
  ] : [
    { icon: Settings, text: 'Help me set up my business profile' },
  ]

  const getMessageText = (message: typeof messages[0]): string => {
    if (!message.parts || !Array.isArray(message.parts)) return ''
    return message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show onboarding prompt if no profile
  if (!profile?.onboarding_completed) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Growth Assistant</h1>
              <p className="text-muted-foreground">Your AI partner for business growth</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-lg border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Let me learn about your business</h2>
              <p className="text-muted-foreground mb-6">
                To provide personalized growth strategies, weekly tasks, and actionable insights, I need to understand your business goals, target market, and current situation.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                This quick 5-minute setup will help me become your dedicated growth partner.
              </p>
              <Button 
                onClick={() => router.push('/ai/onboarding')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Business Setup
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Growth Assistant</h1>
            <p className="text-muted-foreground">{profile.company_name} - {profile.industry}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {goals.length > 0 && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
              <Target className="w-3 h-3 mr-1" />
              {goals.length} Active Goal{goals.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {tasks.length > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {completedTasks}/{tasks.length} Tasks
            </Badge>
          )}
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Agent
          </Badge>
        </div>
      </div>

      {/* Quick Stats Bar */}
      {(goals.length > 0 || tasks.length > 0) && (
        <div className="px-6 py-3 border-b border-border bg-card/50 flex items-center gap-6 text-sm overflow-x-auto">
          {profile.revenue_goal && (
            <div className="flex items-center gap-2 shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-muted-foreground">Revenue Goal:</span>
              <span className="font-mono font-semibold text-foreground">${profile.revenue_goal.toLocaleString()}/mo</span>
            </div>
          )}
          {pendingTasks > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-muted-foreground">Pending Tasks:</span>
              <span className="font-semibold text-foreground">{pendingTasks}</span>
            </div>
          )}
          {profile.weekly_capacity_hours && (
            <div className="flex items-center gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <span className="text-muted-foreground">Weekly Capacity:</span>
              <span className="font-semibold text-foreground">{profile.weekly_capacity_hours}h</span>
            </div>
          )}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center mb-6">
                <Lightbulb className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Ready to grow {profile.company_name}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                I know your business, goals, and priorities. Ask me for weekly tasks, insights, or strategies to hit your revenue target.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      sendMessage({ text: prompt.text })
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left"
                  >
                    <prompt.icon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`rounded-xl p-4 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{getMessageText(message)}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-6 border-t border-border bg-background/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for weekly tasks, insights, or help with goals..."
              className="flex-1 h-12 bg-card border-border"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-12 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

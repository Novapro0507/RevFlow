'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Send, Loader2, TrendingUp, Target, CalendarCheck, Sparkles, User } from 'lucide-react'

export default function GrowthAssistantPage() {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/growth-assistant' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

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

  const suggestedPrompts = [
    { icon: TrendingUp, text: 'Generate my weekly tasks to grow revenue' },
    { icon: Target, text: 'Analyze my sales funnel and find bottlenecks' },
    { icon: CalendarCheck, text: 'What should I focus on this week?' },
    { icon: Sparkles, text: 'Help me set a goal to increase conversions by 20%' },
  ]

  const getMessageText = (message: typeof messages[0]): string => {
    if (!message.parts || !Array.isArray(message.parts)) return ''
    return message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
  }

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
            <p className="text-muted-foreground">Your AI partner for business growth and sales strategy</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
          <Sparkles className="w-3 h-3 mr-1" />
          AI Agent
        </Badge>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center mb-6">
                <Lightbulb className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Growth Assistant</h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                I can analyze your business metrics, create weekly task lists, set goals, and provide actionable strategies to grow your revenue.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(prompt.text)
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
                      <span className="text-sm text-muted-foreground">Analyzing...</span>
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
              placeholder="Ask for insights, weekly tasks, or growth strategies..."
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

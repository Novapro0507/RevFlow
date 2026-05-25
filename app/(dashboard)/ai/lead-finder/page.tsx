'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Send, Loader2, Target, MapPin, Building, Sparkles, User } from 'lucide-react'

export default function LeadFinderPage() {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/lead-finder' }),
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
    { icon: Target, text: 'Find high-scoring leads in my database' },
    { icon: MapPin, text: 'Search for leads in Texas' },
    { icon: Building, text: 'Show me B2B leads in tech industry' },
    { icon: Sparkles, text: 'Analyze my best converting lead sources' },
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lead Finder AI</h1>
            <p className="text-muted-foreground">Find and analyze leads looking for your services</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
          <Sparkles className="w-3 h-3 mr-1" />
          AI Agent
        </Badge>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Lead Finder AI</h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                I can help you find leads in your database, analyze lead quality, and discover new opportunities. What would you like to know?
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
                    <prompt.icon className="w-5 h-5 text-amber-500 flex-shrink-0" />
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
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
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
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
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
              placeholder="Ask about leads, search criteria, or analysis..."
              className="flex-1 h-12 bg-card border-border"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-12 px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
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

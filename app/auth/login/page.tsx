'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Zap, Shield, AlertTriangle, Radio } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Login failed')
        setLoading(false)
        return
      }

      if (result.session) {
        const supabase = createClient()
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        })
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('[v0] Login error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />

      <div className="relative w-full max-w-md">
        {/* System status bar */}
        <div className="mb-6 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-success animate-pulse" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">System Online</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{currentTime}</span>
        </div>

        <Card className="border-border bg-card/80 backdrop-blur-sm shadow-2xl shadow-primary/5">
          <CardHeader className="space-y-4 text-center pb-2">
            <div className="flex items-center justify-center">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(234,88,12,0.3)]">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground tracking-tight">RevFlow</CardTitle>
              <CardDescription className="text-muted-foreground font-mono text-xs uppercase tracking-wider mt-1">
                Command Center Access
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Operator ID
                  </FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="operator@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-input border-border focus:border-primary/50 focus:ring-primary/20 font-mono"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Access Code
                  </FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter access code"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-input border-border focus:border-primary/50 focus:ring-primary/20"
                  />
                </Field>
              </FieldGroup>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="font-mono text-xs">{error}</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(234,88,12,0.2)] font-mono uppercase tracking-wider" 
                disabled={loading}
              >
                {loading ? <Spinner className="mr-2" /> : null}
                {loading ? 'Authenticating...' : 'Access System'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {"Need access?"}{' '}
              <a href="/auth/sign-up" className="text-primary hover:underline font-medium">
                Request credentials
              </a>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              <Shield className="w-3 h-3" />
              <span>Authorized Personnel Only</span>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="mt-6 text-center">
          <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
            RevFlow Command Center v1.0
          </p>
        </div>
      </div>
    </div>
  )
}

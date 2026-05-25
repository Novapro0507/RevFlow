'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Loader2, Shield, Radio, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('')

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Sign up failed')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setIsLoading(false)
    } catch (err) {
      console.error('[v0] Sign up error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-success/20 rounded-full blur-[100px]" />
        
        <div className="relative w-full max-w-md">
          <Card className="border-border bg-card/80 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center mb-4 border border-success/20">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground tracking-tight">Access Granted</CardTitle>
              <CardDescription className="text-muted-foreground font-mono text-xs uppercase tracking-wider mt-1">
                Account Created Successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                Your credentials have been registered. You can now access the Command Center.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(234,88,12,0.2)] font-mono uppercase tracking-wider">
                <Link href="/auth/login">Access System</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">New User Registration</span>
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
                Request System Access
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">First Name</label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="bg-input border-border focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Last Name</label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="bg-input border-border focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Operator Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="operator@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input border-border focus:border-primary/50 focus:ring-primary/20 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Access Code</label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input border-border focus:border-primary/50 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Confirm Access Code</label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your code"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-input border-border focus:border-primary/50 focus:ring-primary/20"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="font-mono text-xs">{error}</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(234,88,12,0.2)] font-mono uppercase tracking-wider" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Request Access'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have credentials?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Access System
              </Link>
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

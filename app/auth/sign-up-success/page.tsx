import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap, Mail, ArrowRight } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <Card className="w-full max-w-md border-border bg-card text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-success" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">RevFlow</span>
          </div>
          <CardTitle className="text-2xl text-foreground">Check your email</CardTitle>
          <CardDescription className="text-muted-foreground">
            {"We've sent you a confirmation link. Click it to activate your account and start discovering hot leads."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              {"Didn't receive the email? Check your spam folder or request a new link."}
            </p>
          </div>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">
              Go to login
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

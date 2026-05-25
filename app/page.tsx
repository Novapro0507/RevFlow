import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Zap, 
  TrendingUp, 
  Users, 
  Mail, 
  Search, 
  BarChart3, 
  Sparkles,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">RevFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered Revenue Intelligence
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6 text-balance">
            Find Hot Leads. Close More Deals. Automate Outreach.
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
            RevFlow combines real-time lead discovery with intelligent CRM and automated email sequences to maximize your revenue.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            100% free. No credit card required.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything you need to grow revenue
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three powerful tools working together to help you find, nurture, and close more deals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Search}
              title="Lead Discovery"
              description="Find hot leads in real-time with Google intent monitoring. Know who's actively searching for your services."
              features={[
                'Google keyword monitoring',
                'Location-based search',
                'Apollo.io & Hunter.io integration',
                'AI lead scoring',
              ]}
            />
            <FeatureCard
              icon={Users}
              title="Intelligent CRM"
              description="Visual pipeline management with AI-powered insights to help you close deals faster."
              features={[
                'Kanban deal boards',
                'Activity tracking',
                'Deal probability scoring',
                'Custom workflows',
              ]}
            />
            <FeatureCard
              icon={Mail}
              title="Email Sequences"
              description="Automated, personalized email campaigns that reach the right person at the right time."
              features={[
                'Visual sequence builder',
                'AI personalization',
                'Smart send-time optimization',
                'A/B testing',
              ]}
            />
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Powered by AI
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                AI that actually helps you close deals
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our AI engine analyzes every interaction to give you actionable insights and predictions.
              </p>
              <div className="space-y-4">
                {[
                  { title: 'Lead Scoring', desc: 'Instantly rank leads by conversion probability' },
                  { title: 'Email Personalization', desc: 'AI writes compelling, personalized emails' },
                  { title: 'Deal Predictions', desc: 'Know which deals will close and when' },
                  { title: 'Smart Follow-ups', desc: 'Optimal timing for every touchpoint' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={TrendingUp} value="40%" label="Higher close rates" />
              <StatCard icon={Search} value="3x" label="More qualified leads" />
              <StatCard icon={Mail} value="60%" label="Better email opens" />
              <StatCard icon={BarChart3} value="2x" label="Revenue growth" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to maximize your revenue?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of sales teams using RevFlow to find and close more deals.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">RevFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with AI to maximize your revenue.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  features,
}: {
  icon: React.ElementType
  title: string
  description: string
  features: string[]
}) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType
  value: string
  label: string
}) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border text-center">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

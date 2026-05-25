'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Zap, 
  Building2, 
  Target, 
  Users, 
  DollarSign, 
  MapPin, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Loader2
} from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Your Business', icon: Building2 },
  { id: 2, title: 'Target Market', icon: Target },
  { id: 3, title: 'Goals & Revenue', icon: DollarSign },
  { id: 4, title: 'Capacity & Priorities', icon: Users },
]

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Real Estate', 'Construction',
  'Manufacturing', 'Retail', 'Food & Beverage', 'Professional Services',
  'Marketing & Advertising', 'Legal', 'Education', 'Transportation',
  'Home Services', 'Automotive', 'Other'
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [serviceInput, setServiceInput] = useState('')
  const [areaInput, setAreaInput] = useState('')
  const [competitorInput, setCompetitorInput] = useState('')
  const [priorityInput, setPriorityInput] = useState('')
  
  const [profile, setProfile] = useState({
    company_name: '',
    industry: '',
    services: [] as string[],
    target_market: '',
    ideal_customer_profile: '',
    business_model: '' as 'b2b' | 'b2c' | 'both' | '',
    revenue_goal: '',
    revenue_current: '',
    team_size: '',
    location: '',
    service_areas: [] as string[],
    competitors: [] as string[],
    unique_value_proposition: '',
    pain_points: [] as string[],
    growth_priorities: [] as string[],
    weekly_capacity_hours: '',
  })

  const addToArray = (field: keyof typeof profile, value: string, setInput: (v: string) => void) => {
    if (value.trim() && Array.isArray(profile[field])) {
      setProfile(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }))
      setInput('')
    }
  }

  const removeFromArray = (field: keyof typeof profile, index: number) => {
    if (Array.isArray(profile[field])) {
      setProfile(prev => ({
        ...prev,
        [field]: (prev[field] as string[]).filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { error } = await supabase
        .from('business_profiles')
        .upsert({
          user_id: user.id,
          company_name: profile.company_name,
          industry: profile.industry,
          services: profile.services,
          target_market: profile.target_market,
          ideal_customer_profile: profile.ideal_customer_profile,
          business_model: profile.business_model || null,
          revenue_goal: profile.revenue_goal ? parseFloat(profile.revenue_goal) : null,
          revenue_current: profile.revenue_current ? parseFloat(profile.revenue_current) : null,
          team_size: profile.team_size ? parseInt(profile.team_size) : null,
          location: profile.location,
          service_areas: profile.service_areas,
          competitors: profile.competitors,
          unique_value_proposition: profile.unique_value_proposition,
          growth_priorities: profile.growth_priorities,
          weekly_capacity_hours: profile.weekly_capacity_hours ? parseInt(profile.weekly_capacity_hours) : null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) throw error
      
      router.push('/ai/growth-assistant')
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(251,146,60,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,146,60,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      <Card className="w-full max-w-2xl border-border relative">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Growth Assistant Setup</span>
          </div>
          <CardDescription className="text-muted-foreground">
            Tell me about your business so I can provide personalized insights and strategies
          </CardDescription>
        </CardHeader>

        {/* Progress Steps */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  step >= s.id 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-border text-muted-foreground'
                }`}>
                  {step > s.id ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${step > s.id ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {STEPS.map(s => (
              <span key={s.id} className={step >= s.id ? 'text-foreground' : ''}>{s.title}</span>
            ))}
          </div>
        </div>

        <CardContent className="space-y-6">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  placeholder="Your company name"
                  value={profile.company_name}
                  onChange={(e) => setProfile(p => ({ ...p, company_name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select value={profile.industry} onValueChange={(v) => setProfile(p => ({ ...p, industry: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(ind => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="business_model">Business Model</Label>
                <Select value={profile.business_model} onValueChange={(v: 'b2b' | 'b2c' | 'both') => setProfile(p => ({ ...p, business_model: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your business model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="b2b">B2B (Business to Business)</SelectItem>
                    <SelectItem value="b2c">B2C (Business to Consumer)</SelectItem>
                    <SelectItem value="both">Both B2B and B2C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Services You Offer</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add a service and press Enter"
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('services', serviceInput, setServiceInput))}
                  />
                  <Button type="button" variant="outline" onClick={() => addToArray('services', serviceInput, setServiceInput)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.services.map((s, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {s}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeFromArray('services', i)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="uvp">What Makes You Different? (Value Proposition)</Label>
                <Textarea
                  id="uvp"
                  placeholder="Describe what sets you apart from competitors..."
                  value={profile.unique_value_proposition}
                  onChange={(e) => setProfile(p => ({ ...p, unique_value_proposition: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Target Market */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="target_market">Target Market Description</Label>
                <Textarea
                  id="target_market"
                  placeholder="Describe who your ideal customers are (e.g., small business owners, homeowners in suburban areas, tech startups...)"
                  value={profile.target_market}
                  onChange={(e) => setProfile(p => ({ ...p, target_market: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="icp">Ideal Customer Profile</Label>
                <Textarea
                  id="icp"
                  placeholder="Describe your perfect customer in detail (demographics, pain points, budget, decision-making process...)"
                  value={profile.ideal_customer_profile}
                  onChange={(e) => setProfile(p => ({ ...p, ideal_customer_profile: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="location">Your Business Location</Label>
                <Input
                  id="location"
                  placeholder="City, State"
                  value={profile.location}
                  onChange={(e) => setProfile(p => ({ ...p, location: e.target.value }))}
                />
              </div>

              <div>
                <Label>Service Areas</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add a city/region you serve"
                    value={areaInput}
                    onChange={(e) => setAreaInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('service_areas', areaInput, setAreaInput))}
                  />
                  <Button type="button" variant="outline" onClick={() => addToArray('service_areas', areaInput, setAreaInput)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.service_areas.map((s, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      <MapPin className="w-3 h-3" />
                      {s}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeFromArray('service_areas', i)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Key Competitors</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add a competitor"
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('competitors', competitorInput, setCompetitorInput))}
                  />
                  <Button type="button" variant="outline" onClick={() => addToArray('competitors', competitorInput, setCompetitorInput)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.competitors.map((s, i) => (
                    <Badge key={i} variant="outline" className="gap-1">
                      {s}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeFromArray('competitors', i)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Goals & Revenue */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="revenue_current">Current Monthly Revenue ($)</Label>
                  <Input
                    id="revenue_current"
                    type="number"
                    placeholder="e.g., 50000"
                    value={profile.revenue_current}
                    onChange={(e) => setProfile(p => ({ ...p, revenue_current: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="revenue_goal">Monthly Revenue Goal ($)</Label>
                  <Input
                    id="revenue_goal"
                    type="number"
                    placeholder="e.g., 100000"
                    value={profile.revenue_goal}
                    onChange={(e) => setProfile(p => ({ ...p, revenue_goal: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="team_size">Team Size</Label>
                <Input
                  id="team_size"
                  type="number"
                  placeholder="Number of employees"
                  value={profile.team_size}
                  onChange={(e) => setProfile(p => ({ ...p, team_size: e.target.value }))}
                />
              </div>

              <div>
                <Label>Growth Priorities (What do you want to focus on?)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="e.g., More leads, Better conversion, Expand to new markets"
                    value={priorityInput}
                    onChange={(e) => setPriorityInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('growth_priorities', priorityInput, setPriorityInput))}
                  />
                  <Button type="button" variant="outline" onClick={() => addToArray('growth_priorities', priorityInput, setPriorityInput)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.growth_priorities.map((s, i) => (
                    <Badge key={i} variant="default" className="gap-1">
                      <Target className="w-3 h-3" />
                      {s}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeFromArray('growth_priorities', i)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Capacity */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="weekly_hours">Weekly Hours Available for Growth Activities</Label>
                <Input
                  id="weekly_hours"
                  type="number"
                  placeholder="e.g., 10"
                  value={profile.weekly_capacity_hours}
                  onChange={(e) => setProfile(p => ({ ...p, weekly_capacity_hours: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How many hours per week can you dedicate to sales, marketing, and growth activities?
                </p>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Ready to Launch Your Growth Assistant
                </h4>
                <p className="text-sm text-muted-foreground">
                  Based on the information you provided, I will:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>- Analyze your business and create a growth strategy</li>
                  <li>- Generate weekly tasks prioritized by impact</li>
                  <li>- Find leads that match your ideal customer profile</li>
                  <li>- Track your progress toward revenue goals</li>
                  <li>- Provide actionable insights based on your data</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {step < 4 ? (
              <Button onClick={() => setStep(s => s + 1)}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Launch Growth Assistant
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

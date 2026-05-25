export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  company_name: string | null
  role: string | null
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  job_title: string | null
  industry: string | null
  location: string | null
  website: string | null
  linkedin_url: string | null
  lead_type: 'b2b' | 'b2c'
  lead_score: number
  intent_strength: number
  intent_signals: string[]
  source: string | null
  tags: string[]
  search_keywords: string | null
  search_location: string | null
  google_place_id: string | null
  google_rating: number | null
  google_reviews_count: number | null
  last_search_detected_at: string | null
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'
  notes: string | null
  enrichment_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PipelineStage {
  id: string
  name: string
  order: number
}

export interface Pipeline {
  id: string
  user_id: string
  name: string
  description: string | null
  stages: PipelineStage[]
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  user_id: string
  pipeline_id: string
  lead_id: string | null
  title: string
  value: number
  currency: string
  stage: string
  probability: number
  expected_close_date: string | null
  actual_close_date: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  company_name: string | null
  notes: string | null
  tags: string[]
  custom_fields: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  user_id: string
  lead_id: string | null
  deal_id: string | null
  type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'other'
  title: string
  description: string | null
  outcome: string | null
  scheduled_at: string | null
  completed_at: string | null
  is_completed: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Sequence {
  id: string
  user_id: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'paused' | 'archived'
  trigger_type: 'manual' | 'lead_created' | 'deal_stage_changed' | 'tag_added'
  trigger_config: Record<string, unknown>
  settings: {
    sendOnWeekends: boolean
    timezone: string
  }
  stats: {
    enrolled: number
    completed: number
    replied: number
    bounced: number
  }
  created_at: string
  updated_at: string
}

export interface SequenceStep {
  id: string
  sequence_id: string
  step_order: number
  step_type: 'email' | 'wait' | 'condition' | 'task'
  subject: string | null
  body: string | null
  wait_days: number
  wait_hours: number
  condition_config: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SearchMonitor {
  id: string
  user_id: string
  name: string
  keywords: string[]
  location: string
  radius_miles: number
  service_category: string | null
  is_active: boolean
  run_frequency: 'hourly' | 'daily' | 'weekly'
  last_run_at: string | null
  created_at: string
  updated_at: string
}

export interface SearchResult {
  id: string
  monitor_id: string
  title: string | null
  snippet: string | null
  url: string | null
  position: number | null
  business_name: string | null
  business_phone: string | null
  business_address: string | null
  detected_intent: string | null
  intent_score: number
  lead_id: string | null
  found_at: string
}

export interface EmailSent {
  id: string
  user_id: string
  sequence_id: string | null
  step_id: string | null
  lead_id: string | null
  to_email: string
  subject: string
  body: string
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed'
  resend_id: string | null
  opened_at: string | null
  clicked_at: string | null
  replied_at: string | null
  bounced_at: string | null
  error_message: string | null
  metadata: Record<string, unknown>
  sent_at: string | null
  created_at: string
}

export interface AIPrediction {
  id: string
  user_id: string
  deal_id: string | null
  lead_id: string | null
  prediction_type: 'deal_close' | 'lead_score' | 'best_action' | 'send_time' | 'churn_risk'
  prediction_value: number | null
  confidence: number | null
  reasoning: string | null
  factors: Array<{ name: string; impact: number }>
  expires_at: string | null
  created_at: string
}

// Dashboard stats
export interface DashboardStats {
  totalLeads: number
  newLeadsThisWeek: number
  totalDeals: number
  pipelineValue: number
  wonDeals: number
  wonRevenue: number
  emailsSent: number
  emailOpenRate: number
  hotLeads: number
}

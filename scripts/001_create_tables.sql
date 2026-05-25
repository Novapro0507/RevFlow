-- RevFlow Database Schema
-- Core tables for CRM, Lead Generation, and Email Sequences

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Contact Info
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  linkedin_url TEXT,
  -- Company Info
  company_name TEXT,
  company_domain TEXT,
  company_size TEXT,
  industry TEXT,
  job_title TEXT,
  -- Location & Demographics
  city TEXT,
  state TEXT,
  country TEXT,
  timezone TEXT,
  -- Scoring & Intent
  lead_score INTEGER DEFAULT 0,
  intent_signals JSONB DEFAULT '[]'::jsonb,
  source TEXT,
  tags TEXT[] DEFAULT '{}',
  -- Google Intent Data
  search_keywords TEXT[],
  search_location TEXT,
  google_place_id TEXT,
  google_rating DECIMAL(2,1),
  google_reviews_count INTEGER,
  last_search_detected_at TIMESTAMPTZ,
  intent_strength INTEGER DEFAULT 0,
  -- Status
  status TEXT DEFAULT 'new',
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_select_own" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "leads_insert_own" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "leads_update_own" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "leads_delete_own" ON public.leads FOR DELETE USING (auth.uid() = user_id);

-- Pipelines table
CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stages JSONB DEFAULT '[
    {"id": "lead", "name": "Lead", "order": 0, "probability": 10},
    {"id": "qualified", "name": "Qualified", "order": 1, "probability": 25},
    {"id": "proposal", "name": "Proposal", "order": 2, "probability": 50},
    {"id": "negotiation", "name": "Negotiation", "order": 3, "probability": 75},
    {"id": "closed_won", "name": "Closed Won", "order": 4, "probability": 100},
    {"id": "closed_lost", "name": "Closed Lost", "order": 5, "probability": 0}
  ]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipelines_select_own" ON public.pipelines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pipelines_insert_own" ON public.pipelines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pipelines_update_own" ON public.pipelines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pipelines_delete_own" ON public.pipelines FOR DELETE USING (auth.uid() = user_id);

-- Deals table
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stage TEXT DEFAULT 'lead',
  probability INTEGER DEFAULT 10,
  expected_close_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals_select_own" ON public.deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "deals_insert_own" ON public.deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "deals_update_own" ON public.deals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "deals_delete_own" ON public.deals FOR DELETE USING (auth.uid() = user_id);

-- Activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- call, email, meeting, note, task
  title TEXT,
  content TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_select_own" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activities_insert_own" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_update_own" ON public.activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "activities_delete_own" ON public.activities FOR DELETE USING (auth.uid() = user_id);

-- Email Sequences table
CREATE TABLE IF NOT EXISTS public.sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft', -- draft, active, paused
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sequences_select_own" ON public.sequences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sequences_insert_own" ON public.sequences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sequences_update_own" ON public.sequences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sequences_delete_own" ON public.sequences FOR DELETE USING (auth.uid() = user_id);

-- Sequence Steps table
CREATE TABLE IF NOT EXISTS public.sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  delay_days INTEGER DEFAULT 1,
  delay_hours INTEGER DEFAULT 0,
  subject_template TEXT,
  body_template TEXT,
  ai_personalize BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS needed - accessed via sequence ownership

-- Sequence Enrollments table
CREATE TABLE IF NOT EXISTS public.sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active', -- active, paused, completed, bounced
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  next_send_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments_select_own" ON public.sequence_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "enrollments_insert_own" ON public.sequence_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "enrollments_update_own" ON public.sequence_enrollments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "enrollments_delete_own" ON public.sequence_enrollments FOR DELETE USING (auth.uid() = user_id);

-- Emails Sent table
CREATE TABLE IF NOT EXISTS public.emails_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.sequence_enrollments(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  step_id UUID REFERENCES public.sequence_steps(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced BOOLEAN DEFAULT false,
  resend_id TEXT
);

ALTER TABLE public.emails_sent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emails_select_own" ON public.emails_sent FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "emails_insert_own" ON public.emails_sent FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Google Search Monitors table
CREATE TABLE IF NOT EXISTS public.search_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  location TEXT NOT NULL,
  radius_miles INTEGER DEFAULT 25,
  service_category TEXT,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.search_monitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "monitors_select_own" ON public.search_monitors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "monitors_insert_own" ON public.search_monitors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monitors_update_own" ON public.search_monitors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "monitors_delete_own" ON public.search_monitors FOR DELETE USING (auth.uid() = user_id);

-- Search Results table
CREATE TABLE IF NOT EXISTS public.search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES public.search_monitors(id) ON DELETE CASCADE,
  title TEXT,
  snippet TEXT,
  url TEXT,
  position INTEGER,
  business_name TEXT,
  business_phone TEXT,
  business_address TEXT,
  detected_intent TEXT,
  intent_score INTEGER DEFAULT 0,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  found_at TIMESTAMPTZ DEFAULT NOW()
);

-- No direct RLS - accessed via monitor ownership

-- AI Predictions table
CREATE TABLE IF NOT EXISTS public.ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL, -- close_probability, best_action, risk_factor
  confidence DECIMAL(5,2),
  value JSONB,
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "predictions_select_own" ON public.ai_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "predictions_insert_own" ON public.ai_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON public.deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_id ON public.deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON public.activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_lead_id ON public.emails_sent(lead_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_status ON public.sequence_enrollments(status);

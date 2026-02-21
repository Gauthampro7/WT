-- Migration: Saved skills + completed trade status
-- Run in Supabase SQL Editor if you already have trade_requests and want these features.

-- 1) Allow 'completed' status on trade_requests
ALTER TABLE public.trade_requests
  DROP CONSTRAINT IF EXISTS trade_requests_status_check;

ALTER TABLE public.trade_requests
  ADD CONSTRAINT trade_requests_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed'));

-- 2) Saved/bookmarked skills table
CREATE TABLE IF NOT EXISTS public.saved_skills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_skills_user_id ON public.saved_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_skills_skill_id ON public.saved_skills(skill_id);

ALTER TABLE public.saved_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved skills" ON public.saved_skills
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved skills" ON public.saved_skills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved skills" ON public.saved_skills
  FOR DELETE USING (auth.uid() = user_id);

-- Migration: Add trade_requests table + allow users to read own skills
-- Run this in Supabase SQL Editor if you already have the base schema

-- Allow users to read their own skills (any status)
CREATE POLICY "Users can view own skills" ON public.skills
  FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.trade_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  message TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(skill_id, requester_id)
);

CREATE INDEX IF NOT EXISTS idx_trade_requests_skill_id ON public.trade_requests(skill_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_requester_id ON public.trade_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON public.trade_requests(status);

ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;

-- Requester can see their own requests
CREATE POLICY "Users can view own trade requests" ON public.trade_requests
  FOR SELECT USING (auth.uid() = requester_id);

-- Skill owner can see requests on their skills
CREATE POLICY "Skill owners can view requests on their skills" ON public.trade_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.skills WHERE skills.id = trade_requests.skill_id AND skills.user_id = auth.uid())
  );

-- Authenticated users can create (request) - only as requester
CREATE POLICY "Authenticated users can create trade requests" ON public.trade_requests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = requester_id);

-- Requester can update only to cancel
CREATE POLICY "Requester can update own requests" ON public.trade_requests
  FOR UPDATE USING (auth.uid() = requester_id);

-- Skill owner can update (accept/decline)
CREATE POLICY "Skill owner can update trade requests" ON public.trade_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.skills WHERE skills.id = trade_requests.skill_id AND skills.user_id = auth.uid())
  );

CREATE TRIGGER update_trade_requests_updated_at
  BEFORE UPDATE ON public.trade_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

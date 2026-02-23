-- SkillSwap Gamification System Database Schema
-- Run this script in the Supabase SQL Editor after the main schema
-- Creates: user_badges table with indexes and RLS policies

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USER BADGES TABLE
-- ============================================================================
-- Stores achievement badges earned by users
-- Requirements: 1.14, 7.1

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, badge_type)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_type ON public.user_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON public.user_badges(earned_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All users can view badges (public achievements)
CREATE POLICY "Users can view all badges" ON public.user_badges
  FOR SELECT USING (true);

-- RLS Policy: Only database functions can insert badges (prevents cheating)
-- No INSERT policy means only SECURITY DEFINER functions can insert
CREATE POLICY "System can insert badges" ON public.user_badges
  FOR INSERT WITH CHECK (false);

-- No UPDATE or DELETE policies - badges are permanent once earned
-- ============================================================================
-- 2. POINT TRANSACTIONS TABLE
-- ============================================================================
-- Stores all point-earning activities with audit trail
-- Requirements: 2.10, 7.2

CREATE TABLE IF NOT EXISTS public.point_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL CHECK (points != 0),
  reason TEXT NOT NULL,
  reference_id UUID, -- Optional: links to skill_id, trade_request_id, etc.
  reference_type TEXT, -- 'skill_created', 'trade_completed', 'streak_bonus', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON public.point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_created ON public.point_transactions(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view only their own transactions
CREATE POLICY "Users can view own transactions" ON public.point_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Only database functions can insert transactions (prevents cheating)
-- No INSERT policy means only SECURITY DEFINER functions can insert
CREATE POLICY "System can insert transactions" ON public.point_transactions
  FOR INSERT WITH CHECK (false);

-- No UPDATE or DELETE policies - transactions are immutable audit records

-- ============================================================================
-- 3. USER STREAKS TABLE
-- ============================================================================
-- Tracks consecutive days of user activity with streak freezes
-- Requirements: 4.1-4.6, 7.3

CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INTEGER DEFAULT 0 NOT NULL CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 NOT NULL CHECK (longest_streak >= 0),
  last_activity_date DATE,
  freeze_count INTEGER DEFAULT 0 NOT NULL CHECK (freeze_count >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_streaks_current_streak ON public.user_streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_activity ON public.user_streaks(last_activity_date);

-- Enable Row Level Security
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All users can view streaks (public achievements)
CREATE POLICY "Users can view all streaks" ON public.user_streaks
  FOR SELECT USING (true);

-- RLS Policy: Only database functions can manage streaks (prevents cheating)
-- No INSERT/UPDATE/DELETE policies means only SECURITY DEFINER functions can modify
CREATE POLICY "System can manage streaks" ON public.user_streaks
  FOR ALL USING (false);

-- No UPDATE or DELETE policies - only database functions can modify streaks
-- ============================================================================
-- 4. EXTEND USERS TABLE WITH GAMIFICATION COLUMNS
-- ============================================================================
-- Adds level progression and points tracking to existing users table
-- Requirements: 5.1-5.6, 7.4

-- Add gamification columns to existing users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 NOT NULL CHECK (level >= 1),
  ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0 NOT NULL CHECK (total_points >= 0),
  ADD COLUMN IF NOT EXISTS points_to_next_level INTEGER DEFAULT 100 NOT NULL CHECK (points_to_next_level >= 0);

-- Create indexes for efficient leaderboard and ranking queries
CREATE INDEX IF NOT EXISTS idx_users_total_points ON public.users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_level ON public.users(level DESC);

-- Note: RLS policies for users table should already exist from main schema
-- The gamification columns inherit the same security policies

-- ============================================================================
-- 5. LEADERBOARD CACHE MATERIALIZED VIEW
-- ============================================================================
-- Materialized view for efficient leaderboard queries with pre-calculated rankings
-- Requirements: 3.1-3.10, 7.5-7.6

CREATE MATERIALIZED VIEW IF NOT EXISTS public.leaderboard_cache AS
SELECT 
  u.id,
  u.name,
  u.picture,
  u.university,
  u.total_points,
  u.level,
  ROW_NUMBER() OVER (ORDER BY u.total_points DESC, u.created_at ASC) as rank
FROM public.users u
WHERE u.total_points > 0
ORDER BY u.total_points DESC, u.created_at ASC;

-- Create unique index on id for CONCURRENTLY refresh support
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_cache_id ON public.leaderboard_cache(id);

-- Create index on rank for efficient rank-based queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_rank ON public.leaderboard_cache(rank);

-- Create index on university for filtered leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_university ON public.leaderboard_cache(university);

-- ============================================================================
-- LEADERBOARD REFRESH FUNCTION
-- ============================================================================
-- Function to refresh the materialized view (called periodically or on significant updates)
-- Uses CONCURRENTLY to avoid locking the view during refresh

CREATE OR REPLACE FUNCTION public.refresh_leaderboard_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (if needed for manual refresh)
-- GRANT EXECUTE ON FUNCTION public.refresh_leaderboard_cache() TO authenticated;
-- ============================================================================
-- 6. AWARD POINTS FUNCTION
-- ============================================================================
-- Core function to award points to users and update their level progression
-- Requirements: 2.1-2.10, 5.2-5.4, 8.1, 8.8
-- 
-- This function:
-- 1. Inserts a point transaction record for audit trail
-- 2. Atomically updates the user's total_points
-- 3. Calculates new level using formula: level = floor(sqrt(total_points / 100)) + 1
-- 4. Updates points_to_next_level field
-- 5. Uses SECURITY DEFINER to ensure proper authorization

CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_new_total INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Insert transaction record for audit trail
  INSERT INTO public.point_transactions (user_id, points, reason, reference_id, reference_type)
  VALUES (p_user_id, p_points, p_reason, p_reference_id, p_reference_type);
  
  -- Update user's total_points atomically and get new total and current level
  UPDATE public.users
  SET total_points = total_points + p_points
  WHERE id = p_user_id
  RETURNING total_points, level INTO v_new_total, v_old_level;
  
  -- Calculate new level using formula: level = floor(sqrt(total_points / 100)) + 1
  v_new_level := FLOOR(SQRT(v_new_total / 100.0)) + 1;
  
  -- Update level and points_to_next_level if level changed
  IF v_new_level > v_old_level THEN
    UPDATE public.users
    SET 
      level = v_new_level,
      points_to_next_level = (v_new_level * v_new_level * 100) - v_new_total
    WHERE id = p_user_id;
  ELSE
    -- Level didn't change, just update points_to_next_level
    UPDATE public.users
    SET points_to_next_level = (v_old_level * v_old_level * 100) - v_new_total
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (service role will call this)
-- GRANT EXECUTE ON FUNCTION public.award_points(UUID, INTEGER, TEXT, UUID, TEXT) TO authenticated;

-- ============================================================================
-- 7. CHECK AND AWARD BADGE FUNCTION
-- ============================================================================
-- Function to check badge eligibility and award badges to users
-- Requirements: 1.1-1.11, 8.2
-- 
-- This function:
-- 1. Checks if user already has the badge (prevents duplicates)
-- 2. Checks eligibility based on badge type:
--    - Milestone badges: first_trade (1), trader (10), master_trader (50), legend (100)
--    - Specialist badges: tech_master, arts_guru, academic_helper, life_skills_expert (10 each)
--    - Special badges: early_adopter, helpful_mentor, quick_responder
-- 3. Inserts badge record if eligible and not already awarded
-- 4. Returns boolean indicating if badge was awarded
-- 5. Uses SECURITY DEFINER to ensure proper authorization

CREATE OR REPLACE FUNCTION public.check_and_award_badge(
  p_user_id UUID,
  p_badge_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_already_has BOOLEAN;
  v_eligible BOOLEAN := FALSE;
  v_trade_count INTEGER;
  v_category_count INTEGER;
  v_unique_users_helped INTEGER;
BEGIN
  -- Check if user already has this badge
  SELECT EXISTS(
    SELECT 1 FROM public.user_badges 
    WHERE user_id = p_user_id AND badge_type = p_badge_type
  ) INTO v_already_has;
  
  -- If user already has badge, return false (no award needed)
  IF v_already_has THEN
    RETURN FALSE;
  END IF;
  
  -- Check eligibility based on badge type
  CASE p_badge_type
    -- ========================================================================
    -- MILESTONE BADGES: Based on total completed trades
    -- ========================================================================
    
    WHEN 'first_trade' THEN
      -- Requirement 1.1: First completed trade
      SELECT COUNT(*) >= 1 INTO v_eligible
      FROM public.trade_requests tr
      WHERE (tr.requester_id = p_user_id OR tr.skill_id IN (
        SELECT id FROM public.skills WHERE user_id = p_user_id
      )) AND tr.status = 'completed';
      
    WHEN 'trader' THEN
      -- Requirement 1.2: 10 completed trades
      SELECT COUNT(*) >= 10 INTO v_eligible
      FROM public.trade_requests tr
      WHERE (tr.requester_id = p_user_id OR tr.skill_id IN (
        SELECT id FROM public.skills WHERE user_id = p_user_id
      )) AND tr.status = 'completed';
      
    WHEN 'master_trader' THEN
      -- Requirement 1.3: 50 completed trades
      SELECT COUNT(*) >= 50 INTO v_eligible
      FROM public.trade_requests tr
      WHERE (tr.requester_id = p_user_id OR tr.skill_id IN (
        SELECT id FROM public.skills WHERE user_id = p_user_id
      )) AND tr.status = 'completed';
      
    WHEN 'legend' THEN
      -- Requirement 1.4: 100 completed trades
      SELECT COUNT(*) >= 100 INTO v_eligible
      FROM public.trade_requests tr
      WHERE (tr.requester_id = p_user_id OR tr.skill_id IN (
        SELECT id FROM public.skills WHERE user_id = p_user_id
      )) AND tr.status = 'completed';
    
    -- ========================================================================
    -- SPECIALIST BADGES: Based on category-specific trades
    -- ========================================================================
    
    WHEN 'tech_master' THEN
      -- Requirement 1.5: 10 completed trades in Tech category
      SELECT COUNT(*) >= 10 INTO v_eligible
      FROM public.trade_requests tr
      JOIN public.skills s ON tr.skill_id = s.id
      WHERE (tr.requester_id = p_user_id OR s.user_id = p_user_id)
        AND tr.status = 'completed'
        AND s.category = 'Tech';
    
    WHEN 'arts_guru' THEN
      -- Requirement 1.6: 10 completed trades in Arts category
      SELECT COUNT(*) >= 10 INTO v_eligible
      FROM public.trade_requests tr
      JOIN public.skills s ON tr.skill_id = s.id
      WHERE (tr.requester_id = p_user_id OR s.user_id = p_user_id)
        AND tr.status = 'completed'
        AND s.category = 'Arts';
    
    WHEN 'academic_helper' THEN
      -- Requirement 1.7: 10 completed trades in Academic category
      SELECT COUNT(*) >= 10 INTO v_eligible
      FROM public.trade_requests tr
      JOIN public.skills s ON tr.skill_id = s.id
      WHERE (tr.requester_id = p_user_id OR s.user_id = p_user_id)
        AND tr.status = 'completed'
        AND s.category = 'Academic';
    
    WHEN 'life_skills_expert' THEN
      -- Requirement 1.8: 10 completed trades in Life Skills category
      SELECT COUNT(*) >= 10 INTO v_eligible
      FROM public.trade_requests tr
      JOIN public.skills s ON tr.skill_id = s.id
      WHERE (tr.requester_id = p_user_id OR s.user_id = p_user_id)
        AND tr.status = 'completed'
        AND s.category = 'Life Skills';
    
    -- ========================================================================
    -- SPECIAL BADGES: Based on unique criteria
    -- ========================================================================
    
    WHEN 'early_adopter' THEN
      -- Requirement 1.9: One of the first 100 users
      SELECT (
        SELECT COUNT(*) 
        FROM public.users 
        WHERE created_at <= (SELECT created_at FROM public.users WHERE id = p_user_id)
      ) <= 100 INTO v_eligible;
    
    WHEN 'helpful_mentor' THEN
      -- Requirement 1.10: Helped 25 different users through completed trades
      SELECT COUNT(DISTINCT 
        CASE 
          WHEN tr.requester_id = p_user_id THEN s.user_id
          WHEN s.user_id = p_user_id THEN tr.requester_id
        END
      ) >= 25 INTO v_eligible
      FROM public.trade_requests tr
      JOIN public.skills s ON tr.skill_id = s.id
      WHERE (tr.requester_id = p_user_id OR s.user_id = p_user_id)
        AND tr.status = 'completed';
    
    WHEN 'quick_responder' THEN
      -- Requirement 1.11: Average response time under 1 hour over 20 requests
      -- Note: This requires response_time tracking in trade_requests table
      -- For now, we'll check if the column exists and calculate
      SELECT 
        CASE 
          WHEN COUNT(*) >= 20 THEN
            AVG(EXTRACT(EPOCH FROM (responded_at - created_at)) / 3600.0) < 1.0
          ELSE FALSE
        END INTO v_eligible
      FROM public.trade_requests
      WHERE skill_id IN (SELECT id FROM public.skills WHERE user_id = p_user_id)
        AND responded_at IS NOT NULL
        AND status != 'pending';
    
    -- ========================================================================
    -- UNKNOWN BADGE TYPE
    -- ========================================================================
    
    ELSE
      -- Unknown badge type, return false
      RETURN FALSE;
  END CASE;
  
  -- Award badge if eligible
  IF v_eligible THEN
    INSERT INTO public.user_badges (user_id, badge_type)
    VALUES (p_user_id, p_badge_type)
    ON CONFLICT (user_id, badge_type) DO NOTHING;
    RETURN TRUE;
  END IF;
  
  -- Not eligible, return false
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (service role will call this)
-- GRANT EXECUTE ON FUNCTION public.check_and_award_badge(UUID, TEXT) TO authenticated;

-- ============================================================================
-- 8. UPDATE STREAK FUNCTION
-- ============================================================================
-- Function to update user's activity streak with freeze support
-- Requirements: 4.1-4.12, 2.5-2.6
-- 
-- This function:
-- 1. Gets or creates user streak record
-- 2. Calculates days difference from last activity
-- 3. Increments streak for consecutive days (1 day gap)
-- 4. Applies streak freeze if available for missed days (2 day gap with freeze)
-- 5. Resets streak if broken (no freeze available or gap > 2 days)
-- 6. Awards streak milestone bonuses:
--    - 7-day streak: 100 bonus points
--    - 30-day streak: 500 bonus points + 1 streak freeze
-- 7. Updates longest_streak if current exceeds it
-- 8. Uses SECURITY DEFINER to ensure proper authorization

CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_freeze_count INTEGER;
  v_today DATE := CURRENT_DATE;
  v_days_diff INTEGER;
BEGIN
  -- Get or create streak record
  INSERT INTO public.user_streaks (user_id, current_streak, last_activity_date)
  VALUES (p_user_id, 0, NULL)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Fetch current streak data
  SELECT last_activity_date, current_streak, freeze_count
  INTO v_last_activity, v_current_streak, v_freeze_count
  FROM public.user_streaks
  WHERE user_id = p_user_id;
  
  -- If no previous activity, start streak at 1
  IF v_last_activity IS NULL THEN
    UPDATE public.user_streaks
    SET 
      current_streak = 1,
      longest_streak = GREATEST(longest_streak, 1),
      last_activity_date = v_today,
      updated_at = NOW()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;
  
  -- Calculate days difference
  v_days_diff := v_today - v_last_activity;
  
  -- Same day - no change (Requirement 4.1-4.3: activity already recorded today)
  IF v_days_diff = 0 THEN
    RETURN;
  END IF;
  
  -- Consecutive day - increment streak (Requirement 4.4)
  IF v_days_diff = 1 THEN
    UPDATE public.user_streaks
    SET 
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_activity_date = v_today,
      updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Award streak milestone bonuses
    -- 7-day streak bonus (Requirement 2.5, 4.7)
    IF v_current_streak + 1 = 7 THEN
      PERFORM public.award_points(p_user_id, 100, '7-day streak bonus', NULL, 'streak_milestone');
    END IF;
    
    -- 30-day streak bonus and freeze (Requirement 2.6, 4.8, 4.11)
    IF v_current_streak + 1 = 30 THEN
      PERFORM public.award_points(p_user_id, 500, '30-day streak bonus', NULL, 'streak_milestone');
      -- Award streak freeze
      UPDATE public.user_streaks 
      SET freeze_count = freeze_count + 1 
      WHERE user_id = p_user_id;
    END IF;
    
  -- Missed one day but have freeze available (Requirement 4.10)
  ELSIF v_days_diff = 2 AND v_freeze_count > 0 THEN
    UPDATE public.user_streaks
    SET 
      freeze_count = freeze_count - 1,
      last_activity_date = v_today,
      updated_at = NOW()
    WHERE user_id = p_user_id;
    -- Note: current_streak is maintained, not incremented
    
  -- Streak broken - reset to 1 (Requirement 4.5)
  ELSE
    UPDATE public.user_streaks
    SET 
      current_streak = 1,
      last_activity_date = v_today,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (service role will call this)
-- GRANT EXECUTE ON FUNCTION public.update_streak(UUID) TO authenticated;

-- ============================================================================
-- 9. TRADE COMPLETION POINTS TRIGGER
-- ============================================================================
-- Automatically awards points and checks badges when a trade is completed
-- Requirements: 2.2-2.3, 1.1-1.4
-- 
-- This trigger:
-- 1. Fires when trade_requests status changes to 'completed'
-- 2. Awards 30 points to the requester (person requesting the skill)
-- 3. Awards 50 points to the skill provider (person offering the skill)
-- 4. Checks and awards trade-related badges for both users:
--    - first_trade (1 completed trade)
--    - trader (10 completed trades)
--    - master_trader (50 completed trades)
--    - legend (100 completed trades)
-- 5. Uses SECURITY DEFINER to ensure proper authorization

CREATE OR REPLACE FUNCTION public.trigger_award_trade_points()
RETURNS TRIGGER AS $$
DECLARE
  v_skill_owner_id UUID;
BEGIN
  -- Only process when status changes to 'completed'
  -- Check both NEW.status = 'completed' AND OLD.status != 'completed' to prevent duplicate awards
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get the skill owner (provider) ID
    SELECT user_id INTO v_skill_owner_id
    FROM public.skills
    WHERE id = NEW.skill_id;
    
    -- Award points to requester (30 points) - Requirement 2.3
    PERFORM public.award_points(
      NEW.requester_id, 
      30, 
      'Completed trade as requester', 
      NEW.id, 
      'trade_completed'
    );
    
    -- Award points to skill provider (50 points) - Requirement 2.2
    PERFORM public.award_points(
      v_skill_owner_id, 
      50, 
      'Completed trade as provider', 
      NEW.id, 
      'trade_completed'
    );
    
    -- Check and award trade-related badges for requester
    -- Requirements 1.1-1.4: first_trade, trader, master_trader, legend
    PERFORM public.check_and_award_badge(NEW.requester_id, 'first_trade');
    PERFORM public.check_and_award_badge(NEW.requester_id, 'trader');
    PERFORM public.check_and_award_badge(NEW.requester_id, 'master_trader');
    PERFORM public.check_and_award_badge(NEW.requester_id, 'legend');
    
    -- Check and award trade-related badges for skill provider
    -- Requirements 1.1-1.4: first_trade, trader, master_trader, legend
    PERFORM public.check_and_award_badge(v_skill_owner_id, 'first_trade');
    PERFORM public.check_and_award_badge(v_skill_owner_id, 'trader');
    PERFORM public.check_and_award_badge(v_skill_owner_id, 'master_trader');
    PERFORM public.check_and_award_badge(v_skill_owner_id, 'legend');
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on trade_requests table
-- Fires AFTER UPDATE to ensure the status change is committed
-- FOR EACH ROW ensures it runs for every updated trade request
CREATE TRIGGER trade_completion_points
  AFTER UPDATE ON public.trade_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_award_trade_points();

-- Note: This trigger will automatically fire whenever a trade_requests row is updated
-- and the status changes to 'completed'. No manual invocation needed.

-- ============================================================================
-- 10. SKILL CREATION POINTS TRIGGER
-- ============================================================================
-- Automatically awards points when a new skill is created
-- Requirements: 2.1
-- 
-- This trigger:
-- 1. Fires when a new skill is inserted into the skills table
-- 2. Awards 10 points to the skill creator
-- 3. Uses SECURITY DEFINER to ensure proper authorization

CREATE OR REPLACE FUNCTION public.trigger_award_skill_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 10 points to the skill creator
  PERFORM public.award_points(
    NEW.user_id, 
    10, 
    'Created skill post', 
    NEW.id, 
    'skill_created'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on skills table
-- Fires AFTER INSERT to ensure the skill record is committed
-- FOR EACH ROW ensures it runs for every new skill created
CREATE TRIGGER skill_creation_points
  AFTER INSERT ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_award_skill_points();

-- Note: This trigger will automatically fire whenever a new skill is inserted
-- into the skills table. No manual invocation needed.

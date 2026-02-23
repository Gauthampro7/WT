# Gamification System Database Migration Guide

## Overview

This guide will help you set up the gamification system database schema in Supabase. The migration adds tables, functions, triggers, and security policies to enable badges, points, streaks, levels, and leaderboards.

## Prerequisites

- Access to your Supabase project dashboard
- The main SkillSwap schema already deployed (users, skills, trade_requests tables must exist)
- Supabase SQL Editor access

## Migration Steps

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard at [supabase.com](https://supabase.com)
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query** to create a new SQL script

### Step 2: Run the Migration Script

1. Open the `supabase-gamification-schema.sql` file in your project
2. Copy the entire contents of the file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

The script will create:
- ✅ 3 new tables: `user_badges`, `point_transactions`, `user_streaks`
- ✅ 3 new columns on `users` table: `level`, `total_points`, `points_to_next_level`
- ✅ 1 materialized view: `leaderboard_cache`
- ✅ 4 database functions: `award_points`, `check_and_award_badge`, `update_streak`, `refresh_leaderboard_cache`
- ✅ 2 triggers: `trade_completion_points`, `skill_creation_points`
- ✅ Row Level Security policies for all gamification tables

### Step 3: Verify the Migration

Run these verification queries in the SQL Editor:

#### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_badges', 'point_transactions', 'user_streaks');
```
**Expected result:** 3 rows showing all three tables

#### Check Users Table Columns
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('level', 'total_points', 'points_to_next_level');
```
**Expected result:** 3 rows showing the new gamification columns

#### Check Functions Exist
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('award_points', 'check_and_award_badge', 'update_streak', 'refresh_leaderboard_cache');
```
**Expected result:** 4 rows showing all functions

#### Check Triggers Exist
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name IN ('trade_completion_points', 'skill_creation_points');
```
**Expected result:** 2 rows showing both triggers

#### Check Materialized View Exists
```sql
SELECT matviewname 
FROM pg_matviews 
WHERE schemaname = 'public' 
  AND matviewname = 'leaderboard_cache';
```
**Expected result:** 1 row showing leaderboard_cache

### Step 4: Test the System

#### Test 1: Award Points Manually
```sql
-- Award 50 points to a test user (replace with your user ID)
SELECT award_points(
  'YOUR_USER_ID_HERE'::uuid,
  50,
  'Test points',
  NULL,
  'test'
);

-- Verify points were awarded
SELECT id, name, level, total_points, points_to_next_level 
FROM users 
WHERE id = 'YOUR_USER_ID_HERE'::uuid;
```
**Expected result:** User should have 50 total_points, level 1, and 50 points_to_next_level

#### Test 2: Check Badge Award
```sql
-- Try to award a badge (will fail if user doesn't meet criteria)
SELECT check_and_award_badge(
  'YOUR_USER_ID_HERE'::uuid,
  'first_trade'
);

-- Check if badge was awarded
SELECT * FROM user_badges WHERE user_id = 'YOUR_USER_ID_HERE'::uuid;
```

#### Test 3: Update Streak
```sql
-- Update streak for a user
SELECT update_streak('YOUR_USER_ID_HERE'::uuid);

-- Check streak data
SELECT * FROM user_streaks WHERE user_id = 'YOUR_USER_ID_HERE'::uuid;
```
**Expected result:** Streak record created with current_streak = 1

#### Test 4: Refresh Leaderboard
```sql
-- Refresh the leaderboard cache
SELECT refresh_leaderboard_cache();

-- View leaderboard
SELECT * FROM leaderboard_cache ORDER BY rank LIMIT 10;
```

### Step 5: Initialize Existing Users (Optional)

If you have existing users, you may want to initialize their gamification data:

```sql
-- This will set default values for existing users who don't have gamification columns yet
-- (The ALTER TABLE statements in the migration already handle this with DEFAULT values)

-- Optionally, create streak records for all existing users
INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, freeze_count)
SELECT id, 0, 0, NULL, 0
FROM users
ON CONFLICT (user_id) DO NOTHING;
```

## Troubleshooting

### Error: "relation already exists"
This means the table/view already exists. You can either:
- Drop the existing table/view and re-run the migration
- Skip that part of the migration (the script uses `IF NOT EXISTS` where possible)

### Error: "column already exists"
The users table columns already exist. This is fine - the script uses `IF NOT EXISTS` to handle this gracefully.

### Error: "function already exists"
Use `CREATE OR REPLACE FUNCTION` (already in the script) or drop the function first:
```sql
DROP FUNCTION IF EXISTS public.award_points(UUID, INTEGER, TEXT, UUID, TEXT);
```

### Error: "trigger already exists"
Drop the trigger first:
```sql
DROP TRIGGER IF EXISTS trade_completion_points ON public.trade_requests;
DROP TRIGGER IF EXISTS skill_creation_points ON public.skills;
```

## Post-Migration Checklist

- [ ] All tables created successfully
- [ ] Users table extended with gamification columns
- [ ] All functions created successfully
- [ ] All triggers attached successfully
- [ ] Materialized view created successfully
- [ ] RLS policies enabled and working
- [ ] Test queries run successfully
- [ ] Leaderboard cache populated

## Next Steps

Once the database migration is complete:
1. Continue with frontend implementation (tasks 6+)
2. The triggers will automatically award points for:
   - Creating skills (10 points)
   - Completing trades (30 points for requester, 50 for provider)
3. The frontend will call `update_streak()` for streak tracking
4. The leaderboard will update automatically as users earn points

## Maintenance

### Refresh Leaderboard Cache
The leaderboard cache should be refreshed periodically. You can:
- Call it manually: `SELECT refresh_leaderboard_cache();`
- Set up a cron job in Supabase (Database → Cron Jobs)
- Call it from the frontend after significant point changes

### Monitor Performance
Check index usage:
```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_badges', 'point_transactions', 'user_streaks', 'users')
ORDER BY idx_scan DESC;
```

## Support

If you encounter issues:
1. Check the Supabase logs (Logs → Postgres Logs)
2. Verify RLS policies aren't blocking legitimate operations
3. Ensure the main schema (users, skills, trade_requests) exists
4. Check that UUID extension is enabled: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

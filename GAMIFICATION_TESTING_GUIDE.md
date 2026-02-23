# Gamification System Testing Guide

This guide will help you test the gamification system components that have been built so far.

## Prerequisites

Before testing, you need to:
1. ✅ Have a Supabase project set up
2. ✅ Have the main SkillSwap schema deployed (users, skills, trade_requests tables)
3. ✅ Have your Supabase credentials in `.env` file

## Step 1: Deploy the Database Schema

### 1.1 Open Supabase SQL Editor

1. Go to [supabase.com](https://supabase.com) and open your project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### 1.2 Run the Migration

1. Open `supabase-gamification-schema.sql` in your code editor
2. Copy the entire file contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

You should see: `Success. No rows returned`

### 1.3 Verify Tables Were Created

Run this query in SQL Editor:

```sql
-- Check all gamification tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_badges', 'point_transactions', 'user_streaks')
ORDER BY table_name;
```

**Expected Result:** 3 rows showing all three tables

### 1.4 Verify Users Table Was Extended

```sql
-- Check new columns on users table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('level', 'total_points', 'points_to_next_level')
ORDER BY column_name;
```

**Expected Result:** 3 rows showing the gamification columns

### 1.5 Verify Functions Were Created

```sql
-- Check database functions exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('award_points', 'check_and_award_badge', 'update_streak', 'refresh_leaderboard_cache')
ORDER BY routine_name;
```

**Expected Result:** 4 rows showing all functions

## Step 2: Test Database Functions

### 2.1 Get Your User ID

First, find your user ID from the auth system:

```sql
-- Get your user ID (replace with your email)
SELECT id, email, name FROM users WHERE email = 'your-email@example.com';
```

Copy your user ID for the next tests.

### 2.2 Test award_points Function

```sql
-- Award 50 test points to yourself
-- Replace 'YOUR_USER_ID' with your actual UUID
SELECT award_points(
  'YOUR_USER_ID'::uuid,
  50,
  'Test points award',
  NULL,
  'test'
);

-- Check if points were awarded
SELECT id, name, level, total_points, points_to_next_level 
FROM users 
WHERE id = 'YOUR_USER_ID'::uuid;
```

**Expected Result:**
- Function returns successfully (no error)
- User now has 50 total_points
- Level is 1
- points_to_next_level is 50 (100 - 50 = 50)

**Check the transaction was recorded:**

```sql
SELECT * FROM point_transactions 
WHERE user_id = 'YOUR_USER_ID'::uuid 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected Result:** One row showing the 50 points with reason "Test points award"

### 2.3 Test Level-Up

Award enough points to reach level 2:

```sql
-- Award 60 more points (total will be 110, which is level 2)
SELECT award_points(
  'YOUR_USER_ID'::uuid,
  60,
  'Level up test',
  NULL,
  'test'
);

-- Check level increased
SELECT id, name, level, total_points, points_to_next_level 
FROM users 
WHERE id = 'YOUR_USER_ID'::uuid;
```

**Expected Result:**
- total_points: 110
- level: 2 (because 110 points = level 2)
- points_to_next_level: 290 (400 - 110 = 290 to reach level 3)

### 2.4 Test update_streak Function

```sql
-- Update streak for your user
SELECT update_streak('YOUR_USER_ID'::uuid);

-- Check streak was created/updated
SELECT * FROM user_streaks 
WHERE user_id = 'YOUR_USER_ID'::uuid;
```

**Expected Result:**
- current_streak: 1
- longest_streak: 1
- last_activity_date: today's date
- freeze_count: 0

**Test consecutive day (simulate):**

```sql
-- Manually set last_activity_date to yesterday
UPDATE user_streaks 
SET last_activity_date = CURRENT_DATE - 1 
WHERE user_id = 'YOUR_USER_ID'::uuid;

-- Now update streak again
SELECT update_streak('YOUR_USER_ID'::uuid);

-- Check streak incremented
SELECT * FROM user_streaks 
WHERE user_id = 'YOUR_USER_ID'::uuid;
```

**Expected Result:**
- current_streak: 2
- longest_streak: 2

### 2.5 Test check_and_award_badge Function

```sql
-- Try to award first_trade badge (will fail if you haven't completed a trade)
SELECT check_and_award_badge(
  'YOUR_USER_ID'::uuid,
  'first_trade'
);

-- Check if badge was awarded
SELECT * FROM user_badges 
WHERE user_id = 'YOUR_USER_ID'::uuid;
```

**Expected Result:**
- If you have completed trades: Returns TRUE and badge is awarded
- If you haven't: Returns FALSE and no badge is awarded

**Test early_adopter badge:**

```sql
-- This should work if you're in the first 100 users
SELECT check_and_award_badge(
  'YOUR_USER_ID'::uuid,
  'early_adopter'
);

-- Check badges
SELECT badge_type, earned_at FROM user_badges 
WHERE user_id = 'YOUR_USER_ID'::uuid
ORDER BY earned_at DESC;
```

### 2.6 Test Leaderboard Cache

```sql
-- Refresh the leaderboard
SELECT refresh_leaderboard_cache();

-- View top 10 users
SELECT rank, name, total_points, level, university
FROM leaderboard_cache
ORDER BY rank
LIMIT 10;

-- Find your rank
SELECT rank, name, total_points, level
FROM leaderboard_cache
WHERE id = 'YOUR_USER_ID'::uuid;
```

**Expected Result:** You should see your rank based on your total_points

## Step 3: Test Database Triggers

### 3.1 Test Skill Creation Trigger

Create a new skill through your app or directly in the database:

```sql
-- Create a test skill (adjust values as needed)
INSERT INTO skills (user_id, title, description, category, type)
VALUES (
  'YOUR_USER_ID'::uuid,
  'Test Skill for Gamification',
  'Testing automatic point award',
  'Tech',
  'offering'
);

-- Check if 10 points were automatically awarded
SELECT * FROM point_transactions 
WHERE user_id = 'YOUR_USER_ID'::uuid 
  AND reason = 'Created skill post'
ORDER BY created_at DESC 
LIMIT 1;

-- Check total points increased by 10
SELECT total_points FROM users WHERE id = 'YOUR_USER_ID'::uuid;
```

**Expected Result:**
- New point transaction with 10 points
- Total points increased by 10

### 3.2 Test Trade Completion Trigger

This requires two users and a trade request. If you have test data:

```sql
-- Update a trade request to completed status
-- Replace with actual trade_request_id
UPDATE trade_requests 
SET status = 'completed' 
WHERE id = 'TRADE_REQUEST_ID'::uuid;

-- Check if points were awarded to both users
SELECT user_id, points, reason, created_at 
FROM point_transactions 
WHERE reference_id = 'TRADE_REQUEST_ID'::uuid
ORDER BY created_at DESC;
```

**Expected Result:**
- Two point transactions: 30 points to requester, 50 points to provider
- Badges checked for both users (first_trade, trader, etc.)

## Step 4: Test JavaScript Service Layer

### 4.1 Test in Browser Console

1. Start your development server: `npm run dev`
2. Open your app in browser
3. Open browser console (F12)
4. Log in to your app

### 4.2 Test getUserStats

```javascript
// Import the service (if not already available)
import { gamificationService } from './src/services/gamificationService.js';

// Get your user ID from auth context
const userId = 'YOUR_USER_ID'; // Replace with your actual ID

// Test getUserStats
const stats = await gamificationService.getUserStats(userId);
console.log('User Stats:', stats);
```

**Expected Output:**
```javascript
{
  level: 2,
  totalPoints: 120,
  pointsToNextLevel: 280,
  currentStreak: 2,
  longestStreak: 2,
  freezeCount: 0,
  badges: [...]
}
```

### 4.3 Test getPointHistory

```javascript
const history = await gamificationService.getPointHistory(userId, 10);
console.log('Point History:', history);
```

**Expected Output:** Array of recent point transactions

### 4.4 Test getLeaderboard

```javascript
const leaderboard = await gamificationService.getLeaderboard();
console.log('Leaderboard:', leaderboard);

// Test with university filter
const filtered = await gamificationService.getLeaderboard({ 
  university: 'Your University' 
});
console.log('Filtered Leaderboard:', filtered);
```

**Expected Output:** Array of top 100 users with rank

### 4.5 Test getUserRank

```javascript
const rank = await gamificationService.getUserRank(userId);
console.log('My Rank:', rank);
```

**Expected Output:** Your rank number or null if not in top rankings

### 4.6 Test updateStreak

```javascript
await gamificationService.updateStreak(userId);
console.log('Streak updated!');

// Verify by getting stats again
const updatedStats = await gamificationService.getUserStats(userId);
console.log('Updated Streak:', updatedStats.currentStreak);
```

### 4.7 Test Real-time Subscription

```javascript
const subscription = gamificationService.subscribeToLeaderboard((payload) => {
  console.log('Leaderboard changed:', payload);
});

// Later, unsubscribe
subscription.unsubscribe();
```

## Step 5: Test Configuration Functions

### 5.1 Test in Browser Console

```javascript
import { 
  calculateLevel, 
  pointsForLevel, 
  pointsToNextLevel,
  BADGE_DEFINITIONS,
  POINT_RULES,
  LEVEL_UNLOCKS
} from './src/lib/gamificationConfig.js';

// Test level calculation
console.log('Level for 0 points:', calculateLevel(0));     // Should be 1
console.log('Level for 100 points:', calculateLevel(100)); // Should be 2
console.log('Level for 400 points:', calculateLevel(400)); // Should be 3
console.log('Level for 900 points:', calculateLevel(900)); // Should be 4

// Test points for level
console.log('Points for level 2:', pointsForLevel(2));     // Should be 100
console.log('Points for level 3:', pointsForLevel(3));     // Should be 400
console.log('Points for level 5:', pointsForLevel(5));     // Should be 1600

// Test points to next level
console.log('Points to next level:', pointsToNextLevel(250, 2)); // Should be 150

// Check badge definitions
console.log('First Trade Badge:', BADGE_DEFINITIONS.first_trade);
console.log('All Badges:', Object.keys(BADGE_DEFINITIONS));

// Check point rules
console.log('Point Rules:', POINT_RULES);

// Check level unlocks
console.log('Level 5 unlocks:', LEVEL_UNLOCKS[5]);
console.log('Level 10 unlocks:', LEVEL_UNLOCKS[10]);
```

**Expected Output:** All calculations should match the formulas and constants

## Step 6: Integration Test

### 6.1 Complete User Flow Test

1. **Create a new skill** in your app
   - Check database: 10 points should be awarded automatically
   - Check point_transactions table for the record

2. **Complete a trade** (if you have another test user)
   - Check database: 30 points to requester, 50 to provider
   - Check if badges were awarded (first_trade)

3. **Check leaderboard**
   - Use gamificationService.getLeaderboard()
   - Verify your rank appears correctly

4. **Update streak**
   - Use gamificationService.updateStreak(userId)
   - Check user_streaks table

5. **Verify level progression**
   - Award enough points to level up
   - Check that level and points_to_next_level update correctly

## Troubleshooting

### Issue: "relation does not exist"
**Solution:** Run the migration script in Supabase SQL Editor

### Issue: "permission denied"
**Solution:** Check RLS policies. You may need to temporarily disable RLS for testing:
```sql
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
-- Re-enable after testing
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
```

### Issue: "function does not exist"
**Solution:** Verify functions were created:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```

### Issue: Points not awarded automatically
**Solution:** Check if triggers are attached:
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

### Issue: Service methods fail
**Solution:** 
1. Check Supabase connection in `.env`
2. Verify you're logged in (auth.uid() must exist)
3. Check browser console for detailed errors

## Success Criteria

✅ All tables created successfully  
✅ All functions created successfully  
✅ All triggers attached successfully  
✅ Points awarded manually via award_points()  
✅ Level calculation works correctly  
✅ Streak tracking works  
✅ Badge checking works  
✅ Leaderboard displays correctly  
✅ Triggers auto-award points for skills and trades  
✅ Service layer methods work in browser  
✅ Configuration functions calculate correctly  

## Next Steps After Testing

Once everything is working:
1. Continue with frontend implementation (Task 8+)
2. Create UI components to display the data
3. Integrate into existing Dashboard and Profile
4. Add celebration animations and notifications

---

**Need Help?** Check the error messages in:
- Supabase Logs (Logs → Postgres Logs)
- Browser Console (F12)
- Network tab for API calls

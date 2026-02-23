# Implementation Plan: Gamification System

## Overview

This implementation plan breaks down the gamification system into incremental, testable steps. The system adds achievement badges, points/credits, leaderboards, streak tracking, and level progression to the SkillSwap platform. Implementation follows a bottom-up approach: database schema → backend functions → services → UI components → integration.

## Tasks

- [x] 1. Set up database schema and core tables
  - [x] 1.1 Create user_badges table with indexes
    - Create table with id, user_id, badge_type, earned_at columns
    - Add unique constraint on (user_id, badge_type)
    - Create indexes on user_id, badge_type, and earned_at
    - _Requirements: 1.14, 7.1_
  
  - [x] 1.2 Create point_transactions table with indexes
    - Create table with id, user_id, points, reason, reference_id, reference_type, created_at columns
    - Add check constraint for non-zero points
    - Create indexes on user_id, created_at, and composite (user_id, created_at)
    - _Requirements: 2.10, 7.2_
  
  - [x] 1.3 Create user_streaks table with indexes
    - Create table with user_id, current_streak, longest_streak, last_activity_date, freeze_count, updated_at columns
    - Add check constraints for non-negative values
    - Create indexes on current_streak and last_activity_date
    - _Requirements: 4.1-4.6, 7.3_
  
  - [x] 1.4 Extend users table with gamification columns
    - Add level, total_points, points_to_next_level columns to existing users table
    - Add check constraints for positive values
    - Create indexes on total_points and level
    - _Requirements: 5.1-5.6, 7.4_
  
  - [x] 1.5 Create leaderboard_cache materialized view
    - Create materialized view with user stats and ROW_NUMBER for ranking
    - Create unique index on id and indexes on rank and university
    - Create refresh_leaderboard_cache() function
    - _Requirements: 3.1-3.10, 7.5-7.6_

- [x] 2. Implement database functions for core gamification logic
  - [x] 2.1 Create award_points database function
    - Implement function to insert point transaction
    - Update user's total_points atomically
    - Calculate and update level based on points formula: level = floor(sqrt(total_points / 100)) + 1
    - Update points_to_next_level field
    - Use SECURITY DEFINER for proper authorization
    - _Requirements: 2.1-2.10, 5.2-5.4, 8.1, 8.8_
  
  - [x] 2.2 Create check_and_award_badge database function
    - Implement eligibility checking for all badge types
    - Check trade counts for milestone badges (first_trade, trader, master_trader, legend)
    - Check category-specific trade counts for specialist badges
    - Insert badge record if eligible and not already awarded
    - Use SECURITY DEFINER for proper authorization
    - Return boolean indicating if badge was awarded
    - _Requirements: 1.1-1.11, 8.2_
  
  - [x] 2.3 Create update_streak database function
    - Get or create user streak record
    - Calculate days difference from last activity
    - Increment streak for consecutive days
    - Apply streak freeze if available for missed days
    - Reset streak if broken (no freeze available)
    - Award streak milestone bonuses (7-day: 100 points, 30-day: 500 points)
    - Award streak freeze at 30-day milestone
    - Update longest_streak if current exceeds it
    - _Requirements: 4.1-4.12, 2.5-2.6_

- [x] 3. Implement database triggers for automatic point awards
  - [x] 3.1 Create trigger for trade completion points
    - Create trigger_award_trade_points() function
    - Award 30 points to requester on trade completion
    - Award 50 points to skill provider on trade completion
    - Check and award trade-related badges (first_trade, trader, master_trader, legend)
    - Only trigger when status changes to 'completed'
    - Attach trigger to trade_requests table UPDATE events
    - _Requirements: 2.2-2.3, 1.1-1.4_
  
  - [x] 3.2 Create trigger for skill creation points
    - Create trigger_award_skill_points() function
    - Award 10 points when new skill is created
    - Attach trigger to skills table INSERT events
    - _Requirements: 2.1_

- [x] 4. Implement Row Level Security policies
  - [x] 4.1 Configure RLS for user_badges table
    - Enable RLS on user_badges
    - Create policy allowing all users to SELECT badges
    - Restrict INSERT/UPDATE/DELETE to database functions only
    - _Requirements: 8.4-8.7_
  
  - [x] 4.2 Configure RLS for point_transactions table
    - Enable RLS on point_transactions
    - Create policy allowing users to SELECT only their own transactions
    - Restrict INSERT/UPDATE/DELETE to database functions only
    - _Requirements: 8.4-8.7_
  
  - [x] 4.3 Configure RLS for user_streaks table
    - Enable RLS on user_streaks
    - Create policy allowing all users to SELECT streaks
    - Restrict INSERT/UPDATE/DELETE to database functions only
    - _Requirements: 8.4-8.7_

- [x] 5. Checkpoint - Verify database setup
  - Run database migrations
  - Test award_points function with sample data
  - Test check_and_award_badge function with sample data
  - Test update_streak function with various scenarios
  - Verify triggers fire correctly
  - Verify RLS policies enforce security
  - Ensure all tests pass, ask the user if questions arise

- [x] 6. Create gamification service layer
  - [x] 6.1 Implement gamificationService.getUserStats()
    - Query users table for level, total_points, points_to_next_level
    - Query user_streaks for current_streak, longest_streak, freeze_count
    - Query user_badges for all earned badges
    - Return combined stats object
    - _Requirements: 1.13, 2.7-2.8, 4.6, 5.5-5.6_
  
  - [x] 6.2 Implement gamificationService.getPointHistory()
    - Query point_transactions table for user's recent transactions
    - Order by created_at descending
    - Limit to specified number of records (default 20)
    - _Requirements: 2.9_
  
  - [x] 6.3 Implement gamificationService.updateStreak()
    - Call update_streak RPC function
    - Handle errors appropriately
    - _Requirements: 4.1-4.12_
  
  - [x] 6.4 Implement gamificationService.getLeaderboard()
    - Query leaderboard_cache materialized view
    - Apply filters for university if specified
    - Limit to top 100 users
    - _Requirements: 3.1-3.6, 3.9_
  
  - [x] 6.5 Implement gamificationService.getUserRank()
    - Query leaderboard_cache for user's rank
    - Handle case where user is not in leaderboard
    - _Requirements: 3.7_
  
  - [x] 6.6 Implement gamificationService.subscribeToLeaderboard()
    - Set up Supabase real-time subscription for leaderboard changes
    - Listen to postgres_changes on users table where total_points > 0
    - Return subscription object for cleanup
    - _Requirements: 7.8_

- [x] 7. Create badge and level configuration constants
  - [x] 7.1 Define BADGE_DEFINITIONS constant
    - Create object mapping badge types to metadata (title, description, icon, rarity, category)
    - Include all badge types: milestone, specialist, and special badges
    - Map Lucide React icon names for each badge
    - _Requirements: 1.1-1.11_
  
  - [x] 7.2 Define POINT_RULES constant
    - Create object mapping action types to point values
    - Include: skill_created (10), trade_completed_provider (50), trade_completed_requester (30), positive_feedback (20), streak bonuses
    - _Requirements: 2.1-2.6_
  
  - [x] 7.3 Create level calculation utility functions
    - Implement calculateLevel(totalPoints) using formula: floor(sqrt(total_points / 100)) + 1
    - Implement pointsForLevel(level) using formula: level^2 * 100
    - Implement pointsToNextLevel(totalPoints, currentLevel)
    - _Requirements: 5.2-5.3_
  
  - [x] 7.4 Define LEVEL_UNLOCKS constant
    - Create object mapping level numbers to unlocked features
    - Include unlocks at levels 5, 10, 15, 20, 25, 30
    - _Requirements: 5.7-5.9_

- [ ] 8. Create GamificationContext for global state management
  - [~] 8.1 Implement GamificationContext and Provider
    - Create context with userStats, leaderboard, userRank, loading state
    - Implement refreshStats() method using gamificationService
    - Implement refreshLeaderboard() method with filter support
    - Implement showAchievement() method for badge notifications
    - Implement showLevelUp() method for level-up celebrations
    - Load initial stats on mount if user is authenticated
    - _Requirements: 1.13, 2.7-2.8, 3.1-3.10, 4.6, 5.5-5.6_
  
  - [~] 8.2 Integrate GamificationProvider into app
    - Wrap app with GamificationProvider below AuthProvider
    - Ensure context is available to all components
    - _Requirements: 6.9_

- [ ] 9. Implement core UI components for gamification display
  - [~] 9.1 Create BadgeDisplay component
    - Display grid of badges with earned/locked states
    - Use BADGE_DEFINITIONS for badge metadata
    - Show badge icon, title, and rarity
    - Implement hover tooltip with description
    - Apply glassmorphic styling matching existing design
    - Make responsive for mobile
    - _Requirements: 1.13, 6.1-6.2, 6.5_
  
  - [~] 9.2 Create StreakIndicator component
    - Display fire icon with current streak count
    - Show freeze count with tooltip
    - Apply glassmorphic styling
    - Make compact for header integration
    - _Requirements: 4.6, 4.12, 6.1-6.2, 6.5_
  
  - [~] 9.3 Create LevelProgressBar component
    - Display current level and progress to next level
    - Show progress bar with percentage fill
    - Display points: "X / Y points to Level Z"
    - Apply glassmorphic styling
    - Animate progress changes with Framer Motion
    - _Requirements: 5.6, 5.10, 6.1-6.3, 6.5_
  
  - [~] 9.4 Create PointsHistory component
    - Display list of recent point transactions
    - Show points earned, reason, and timestamp
    - Use color coding for different transaction types
    - Apply glassmorphic styling
    - Make scrollable with max height
    - _Requirements: 2.9, 6.1-6.2, 6.5_

- [ ] 10. Implement celebration and notification components
  - [~] 10.1 Create BadgeNotification component
    - Display toast-style notification when badge earned
    - Show badge icon, title, and description
    - Trigger confetti animation using canvas-confetti
    - Auto-dismiss after 5 seconds
    - Use Framer Motion for entrance/exit animations
    - Apply glassmorphic styling
    - Position non-intrusively (top-right corner)
    - _Requirements: 1.12, 6.3-6.4, 6.6_
  
  - [~] 10.2 Create LevelUpModal component
    - Display full-screen modal when user levels up
    - Show old level → new level with animation
    - List newly unlocked features from LEVEL_UNLOCKS
    - Trigger confetti animation
    - Require user dismissal (button click)
    - Use Framer Motion for animations
    - Apply glassmorphic styling
    - _Requirements: 5.4, 6.1-6.4, 6.6_
  
  - [~] 10.3 Create PointsAnimation component
    - Display floating "+X points" text animation
    - Position near action trigger element
    - Fade out and float upward
    - Use Framer Motion for animation
    - Auto-remove from DOM after animation completes
    - _Requirements: 6.3, 6.6_
  
  - [~] 10.4 Create StreakMilestoneNotification component
    - Display notification for streak milestones (7, 30, 100 days)
    - Show streak count and bonus points awarded
    - Use fire icon and celebratory styling
    - Auto-dismiss after 5 seconds
    - Use Framer Motion for animations
    - _Requirements: 4.7-4.9, 6.3, 6.6_

- [ ] 11. Create GamificationDashboard component
  - [~] 11.1 Implement GamificationDashboard layout
    - Create dedicated section in Dashboard for gamification stats
    - Display level with progress bar
    - Display current streak with StreakIndicator
    - Display badge grid with BadgeDisplay
    - Display points history with PointsHistory
    - Apply glassmorphic styling matching existing Dashboard
    - Make responsive for mobile
    - _Requirements: 1.13, 2.7-2.9, 4.6, 5.5-5.6, 6.1-6.2, 6.5, 6.9_
  
  - [~] 11.2 Integrate GamificationDashboard into existing Dashboard
    - Add GamificationDashboard as a new section
    - Ensure proper spacing and layout
    - Test on mobile and desktop
    - _Requirements: 6.9_

- [ ] 12. Create Leaderboard component and modal
  - [~] 12.1 Implement LeaderboardModal component
    - Create full-screen modal with glassmorphic styling
    - Display top 100 users in ranked list
    - Show user's name, picture, points, level, and rank for each entry
    - Highlight current user's entry
    - Implement filter controls for time period (weekly, monthly, all-time)
    - Implement filter controls for university
    - Display current user's rank prominently at top
    - Use Framer Motion for modal animations
    - Make responsive for mobile
    - _Requirements: 3.1-3.10, 6.1-6.2, 6.5_
  
  - [~] 12.2 Implement real-time leaderboard updates
    - Subscribe to leaderboard changes using gamificationService
    - Update leaderboard data when changes occur
    - Animate rank changes with indicators (up/down arrows)
    - Unsubscribe on component unmount
    - _Requirements: 3.8, 7.8_
  
  - [~] 12.3 Add leaderboard access point to navigation
    - Add "Leaderboard" link/button to main navigation
    - Open LeaderboardModal on click
    - Show leaderboard icon from Lucide React
    - _Requirements: 3.1_

- [ ] 13. Integrate gamification into Profile component
  - [~] 13.1 Add gamification display to Profile
    - Display user's level badge near name
    - Display earned badges in dedicated section
    - Use BadgeDisplay component
    - Apply glassmorphic styling matching existing Profile
    - Make responsive for mobile
    - _Requirements: 1.13, 5.5, 6.1-6.2, 6.5, 6.10_
  
  - [~] 13.2 Load gamification stats for viewed profile
    - Fetch gamification stats for profile user (not just current user)
    - Handle loading and error states
    - Display public gamification data only
    - _Requirements: 8.6_

- [ ] 14. Implement streak tracking on user activity
  - [~] 14.1 Add streak update on login
    - Call gamificationService.updateStreak() when user logs in
    - Handle in AuthContext or login flow
    - Show streak milestone notifications if triggered
    - _Requirements: 4.1, 4.4, 4.7-4.9_
  
  - [~] 14.2 Add streak update on skill creation
    - Call gamificationService.updateStreak() after skill is created
    - Trigger from skill creation success handler
    - _Requirements: 4.2, 4.4_
  
  - [~] 14.3 Add streak update on trade completion
    - Call gamificationService.updateStreak() after trade is completed
    - Trigger from trade completion success handler
    - _Requirements: 4.3, 4.4_

- [ ] 15. Implement celebration triggers for achievements
  - [~] 15.1 Listen for new badges in GamificationContext
    - Poll or subscribe to user_badges table for new badges
    - Compare with previous badge list to detect new awards
    - Call showAchievement() when new badge detected
    - _Requirements: 1.12_
  
  - [~] 15.2 Listen for level-ups in GamificationContext
    - Compare previous level with current level on stats refresh
    - Call showLevelUp() when level increases
    - _Requirements: 5.4_
  
  - [~] 15.3 Trigger PointsAnimation on point-earning actions
    - Show animation after skill creation
    - Show animation after trade completion
    - Show animation after receiving positive feedback
    - Pass points earned to animation component
    - _Requirements: 2.1-2.4, 6.3_

- [ ] 16. Implement gamification settings and preferences
  - [~] 16.1 Add gamification visibility toggle to user settings
    - Add "Show Gamification" toggle in settings/preferences
    - Store preference in user profile or local storage
    - Default to enabled
    - _Requirements: 6.7_
  
  - [~] 16.2 Conditionally render gamification elements based on preference
    - Check preference in GamificationContext
    - Hide UI elements when disabled
    - Continue tracking in background
    - _Requirements: 6.7-6.8_

- [ ] 17. Implement theme integration for gamification elements
  - [~] 17.1 Apply theme-aware styling to all gamification components
    - Use existing theme context/system
    - Apply appropriate colors for light/dark themes
    - Ensure glassmorphic effects work in both themes
    - Test all components in both themes
    - _Requirements: 6.2_

- [ ] 18. Implement positive feedback point awards
  - [~] 18.1 Add point award trigger for positive feedback
    - Identify where positive feedback is recorded in existing code
    - Call award_points function when positive feedback is given
    - Award 20 points to the feedback recipient
    - Show PointsAnimation on feedback submission
    - _Requirements: 2.4_

- [ ] 19. Implement category-specific badge checking
  - [~] 19.1 Extend check_and_award_badge for category badges
    - Add logic for tech_master badge (10 Tech trades)
    - Add logic for arts_guru badge (10 Arts trades)
    - Add logic for academic_helper badge (10 Academic trades)
    - Add logic for life_skills_expert badge (10 Life Skills trades)
    - _Requirements: 1.5-1.8_
  
  - [~] 19.2 Trigger category badge checks on trade completion
    - Add category badge checks to trade completion trigger
    - Check all four category badges
    - _Requirements: 1.5-1.8_

- [ ] 20. Implement special badges
  - [~] 20.1 Implement early_adopter badge logic
    - Add check in check_and_award_badge for user creation order
    - Award badge if user is in first 100 users by created_at
    - Trigger check on user registration or first login
    - _Requirements: 1.9_
  
  - [~] 20.2 Implement helpful_mentor badge logic
    - Add query to count distinct users helped (completed trades)
    - Award badge when count reaches 25
    - Trigger check on trade completion
    - _Requirements: 1.10_
  
  - [~] 20.3 Implement quick_responder badge logic
    - Track response times for trade requests
    - Calculate average response time over last 20 requests
    - Award badge when average is under 1 hour
    - Trigger check on trade request response
    - _Requirements: 1.11_

- [ ] 21. Implement leaderboard filtering
  - [~] 21.1 Add time-based filtering to leaderboard
    - Modify getLeaderboard to support weekly filter (last 7 days)
    - Modify getLeaderboard to support monthly filter (last 30 days)
    - Query point_transactions for time-based aggregation
    - Update LeaderboardModal to use filters
    - _Requirements: 3.2-3.4_
  
  - [~] 21.2 Add category filtering to leaderboard
    - Modify getLeaderboard to support category filter
    - Query point_transactions filtered by reference_type and category
    - Update LeaderboardModal to include category filter dropdown
    - _Requirements: 3.6_

- [ ] 22. Implement leaderboard for non-authenticated users
  - [~] 22.1 Handle leaderboard display for logged-out users
    - Show leaderboard without personal rank when not authenticated
    - Hide user-specific elements
    - Allow viewing top 100 users
    - _Requirements: 3.10_

- [ ] 23. Final integration and testing
  - [~] 23.1 Test complete user flow
    - Create new user account and verify Level 1 initialization
    - Create skill post and verify 10 points awarded
    - Complete trade and verify points and badges awarded
    - Check leaderboard and verify rank appears
    - Test streak tracking over multiple days
    - Test level-up flow and celebration
    - Test all badge awards
    - _Requirements: All_
  
  - [~] 23.2 Test edge cases
    - Test streak freeze functionality
    - Test streak reset after missed days
    - Test concurrent point awards
    - Test leaderboard with filters
    - Test gamification visibility toggle
    - Test theme switching with gamification elements
    - _Requirements: All_
  
  - [~] 23.3 Test performance and security
    - Verify database queries are optimized
    - Verify indexes are being used
    - Test RLS policies prevent unauthorized access
    - Test that direct data manipulation is blocked
    - Verify real-time subscriptions work correctly
    - Test with large datasets (100+ users)
    - _Requirements: 7.5-7.10, 8.1-8.10_

- [ ] 24. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all integration tests
  - Verify all requirements are met
  - Test on mobile and desktop
  - Test in light and dark themes
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Database functions use SECURITY DEFINER to ensure proper authorization and prevent client-side manipulation
- Row Level Security (RLS) policies prevent users from directly modifying gamification data
- Materialized view (leaderboard_cache) improves leaderboard query performance
- Real-time subscriptions keep leaderboard updated without polling
- Framer Motion provides smooth animations matching existing UI patterns
- canvas-confetti library adds celebratory effects for achievements
- Glassmorphic styling maintains visual consistency with existing platform design
- All gamification elements are responsive and work on mobile devices
- Gamification can be hidden via user preference while continuing to track in background
- Level progression uses quadratic formula to ensure meaningful progression at higher levels

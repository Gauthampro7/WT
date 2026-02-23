# Requirements Document

## Introduction

This document specifies the requirements for a comprehensive gamification system for the SkillSwap platform. The system will enhance user engagement through achievement badges, points/credits, leaderboards, streak tracking, and a level progression system. The gamification features will integrate seamlessly with the existing React/Vite/Tailwind/Supabase architecture while maintaining the platform's glassmorphic UI aesthetic.

## Glossary

- **Gamification_System**: The complete set of features that reward and track user engagement through badges, points, streaks, and levels
- **Badge**: A visual achievement award given to users for reaching specific milestones
- **Point**: A numeric unit of credit earned through platform activities
- **Streak**: A count of consecutive days with user activity on the platform
- **Level**: A tier of user progression based on accumulated points
- **Leaderboard**: A ranked display of users ordered by points or other metrics
- **Trade**: A completed skill exchange between two users
- **Activity**: Any user action that contributes to gamification metrics (login, post creation, trade completion)
- **User_Profile**: The user's public-facing page displaying their information and gamification stats
- **Dashboard**: The user's private view showing their skills, trades, and gamification progress
- **Celebration_Animation**: A visual effect displayed when users earn achievements or level up

## Requirements

### Requirement 1: Achievement Badge System

**User Story:** As a user, I want to earn badges for my accomplishments on the platform, so that I can showcase my achievements and feel recognized for my contributions.

#### Acceptance Criteria

1. WHEN a user completes their first trade, THE Gamification_System SHALL award a "First Trade" badge
2. WHEN a user completes 10 trades, THE Gamification_System SHALL award a "Trader" badge
3. WHEN a user completes 50 trades, THE Gamification_System SHALL award a "Master Trader" badge
4. WHEN a user completes 100 trades, THE Gamification_System SHALL award a "Legend" badge
5. WHEN a user completes 10 trades in the Tech category, THE Gamification_System SHALL award a "Tech Master" badge
6. WHEN a user completes 10 trades in the Arts category, THE Gamification_System SHALL award an "Arts Guru" badge
7. WHEN a user completes 10 trades in the Academic category, THE Gamification_System SHALL award an "Academic Helper" badge
8. WHEN a user completes 10 trades in the Life Skills category, THE Gamification_System SHALL award a "Life Skills Expert" badge
9. WHEN a user creates their account within the first 100 users, THE Gamification_System SHALL award an "Early Adopter" badge
10. WHEN a user helps 25 different users through completed trades, THE Gamification_System SHALL award a "Helpful Mentor" badge
11. WHEN a user responds to trade requests within 1 hour on average over 20 requests, THE Gamification_System SHALL award a "Quick Responder" badge
12. WHEN a badge is earned, THE Gamification_System SHALL display a celebration animation with the badge details
13. WHEN viewing a User_Profile, THE Gamification_System SHALL display all earned badges
14. WHEN a user earns a badge, THE Gamification_System SHALL persist the badge data to the database

### Requirement 2: Points and Credits System

**User Story:** As a user, I want to earn points for my activities on the platform, so that I can track my engagement and compete with others.

#### Acceptance Criteria

1. WHEN a user creates a skill post, THE Gamification_System SHALL award 10 points
2. WHEN a user completes a trade as the skill provider, THE Gamification_System SHALL award 50 points
3. WHEN a user completes a trade as the requester, THE Gamification_System SHALL award 30 points
4. WHEN a user receives positive feedback on a completed trade, THE Gamification_System SHALL award 20 points
5. WHEN a user maintains a login streak of 7 consecutive days, THE Gamification_System SHALL award 100 bonus points
6. WHEN a user maintains a login streak of 30 consecutive days, THE Gamification_System SHALL award 500 bonus points
7. WHEN viewing the User_Profile, THE Gamification_System SHALL display the user's total points
8. WHEN viewing the Dashboard, THE Gamification_System SHALL display the user's total points
9. WHEN viewing the Dashboard, THE Gamification_System SHALL display a point transaction history showing recent point-earning activities
10. WHEN a user earns points, THE Gamification_System SHALL persist the point transaction to the database with timestamp and reason

### Requirement 3: Leaderboard System

**User Story:** As a user, I want to see how I rank compared to other users, so that I can feel motivated to increase my engagement.

#### Acceptance Criteria

1. WHEN viewing the Leaderboard, THE Gamification_System SHALL display the top 100 users ranked by total points
2. WHEN filtering by time period "weekly", THE Gamification_System SHALL display users ranked by points earned in the last 7 days
3. WHEN filtering by time period "monthly", THE Gamification_System SHALL display users ranked by points earned in the last 30 days
4. WHEN filtering by time period "all-time", THE Gamification_System SHALL display users ranked by total accumulated points
5. WHEN filtering by university, THE Gamification_System SHALL display only users from the selected university
6. WHEN filtering by category, THE Gamification_System SHALL display users ranked by points earned in that specific category
7. WHEN viewing the Leaderboard, THE Gamification_System SHALL display the current user's rank prominently
8. WHEN a user's rank changes, THE Gamification_System SHALL display an animated indicator showing rank movement
9. WHEN viewing the Leaderboard, THE Gamification_System SHALL display each user's name, picture, points, and rank
10. WHEN a user is not logged in, THE Gamification_System SHALL display the Leaderboard without showing personal rank

### Requirement 4: Streak Tracking System

**User Story:** As a user, I want to track my consecutive days of activity, so that I can build habits and maintain engagement with the platform.

#### Acceptance Criteria

1. WHEN a user logs in on a calendar day, THE Gamification_System SHALL record activity for that day
2. WHEN a user creates a skill post on a calendar day, THE Gamification_System SHALL record activity for that day
3. WHEN a user completes a trade on a calendar day, THE Gamification_System SHALL record activity for that day
4. WHEN a user has activity on consecutive calendar days, THE Gamification_System SHALL increment the streak count
5. WHEN a user has no activity for more than 24 hours after their last activity day, THE Gamification_System SHALL reset the streak to zero
6. WHEN viewing the Dashboard, THE Gamification_System SHALL display the current streak count
7. WHEN a user reaches a 7-day streak, THE Gamification_System SHALL display a milestone notification
8. WHEN a user reaches a 30-day streak, THE Gamification_System SHALL display a milestone notification
9. WHEN a user reaches a 100-day streak, THE Gamification_System SHALL display a milestone notification
10. WHERE a user has earned a streak freeze, WHEN the user has no activity for 24 hours, THE Gamification_System SHALL maintain the streak and consume one freeze
11. WHEN a user reaches a 30-day streak, THE Gamification_System SHALL award one streak freeze
12. WHEN viewing the Dashboard, THE Gamification_System SHALL display the number of available streak freezes

### Requirement 5: Level Progression System

**User Story:** As a user, I want to progress through levels as I earn points, so that I can see my growth and unlock new features.

#### Acceptance Criteria

1. WHEN a user creates an account, THE Gamification_System SHALL initialize the user at Level 1
2. WHEN a user accumulates 100 points, THE Gamification_System SHALL advance the user to Level 2
3. WHEN a user advances to a new level, THE Gamification_System SHALL calculate the next level threshold as current_level * 100 points
4. WHEN a user advances to a new level, THE Gamification_System SHALL display a level-up animation and notification
5. WHEN viewing the User_Profile, THE Gamification_System SHALL display the user's current level
6. WHEN viewing the Dashboard, THE Gamification_System SHALL display the user's current level with a progress bar showing points toward the next level
7. WHEN a user reaches Level 5, THE Gamification_System SHALL unlock the ability to create featured skill posts
8. WHEN a user reaches Level 10, THE Gamification_System SHALL unlock priority placement in search results
9. WHEN a user reaches Level 20, THE Gamification_System SHALL unlock a custom profile badge color selector
10. WHEN a user's points increase, THE Gamification_System SHALL update the level progress bar in real-time

### Requirement 6: User Interface Integration

**User Story:** As a user, I want gamification elements to integrate seamlessly with the existing UI, so that the experience feels cohesive and not overwhelming.

#### Acceptance Criteria

1. WHEN displaying gamification elements, THE Gamification_System SHALL use the existing glassmorphic design patterns
2. WHEN displaying gamification elements, THE Gamification_System SHALL respect the user's selected theme
3. WHEN displaying animations, THE Gamification_System SHALL use Framer Motion for smooth transitions
4. WHEN displaying celebration effects, THE Gamification_System SHALL use canvas-confetti library
5. WHEN viewing on mobile devices, THE Gamification_System SHALL display all gamification elements responsively
6. WHEN a notification appears, THE Gamification_System SHALL display it non-intrusively without blocking core functionality
7. WHERE a user prefers minimal UI, THE Gamification_System SHALL provide a setting to hide gamification elements
8. WHEN gamification elements are hidden, THE Gamification_System SHALL continue tracking progress in the background
9. WHEN viewing the Dashboard, THE Gamification_System SHALL display gamification stats in a dedicated section
10. WHEN viewing a User_Profile, THE Gamification_System SHALL display badges and level prominently near the user's name

### Requirement 7: Data Persistence and Performance

**User Story:** As a system administrator, I want gamification data to be stored efficiently and queried performantly, so that the system scales well with user growth.

#### Acceptance Criteria

1. WHEN storing badge data, THE Gamification_System SHALL create a badges table in Supabase with user_id, badge_type, and earned_at fields
2. WHEN storing point transactions, THE Gamification_System SHALL create a point_transactions table with user_id, points, reason, and created_at fields
3. WHEN storing streak data, THE Gamification_System SHALL create a user_streaks table with user_id, current_streak, last_activity_date, and freeze_count fields
4. WHEN storing level data, THE Gamification_System SHALL add level and total_points fields to the existing users table
5. WHEN querying leaderboard data, THE Gamification_System SHALL use database indexes on points and created_at fields
6. WHEN calculating user ranks, THE Gamification_System SHALL use efficient SQL window functions
7. WHEN a user views their Dashboard, THE Gamification_System SHALL load gamification data in a single optimized query
8. WHEN real-time updates are needed, THE Gamification_System SHALL use Supabase real-time subscriptions for leaderboard changes
9. WHEN storing point transactions, THE Gamification_System SHALL implement database triggers to automatically update total_points
10. WHEN querying badge eligibility, THE Gamification_System SHALL use materialized views or cached aggregates for trade counts

### Requirement 8: Security and Data Integrity

**User Story:** As a system administrator, I want gamification data to be secure and tamper-proof, so that users cannot cheat or manipulate their scores.

#### Acceptance Criteria

1. WHEN awarding points, THE Gamification_System SHALL validate the action server-side before persisting
2. WHEN awarding badges, THE Gamification_System SHALL verify eligibility criteria server-side
3. WHEN updating streak data, THE Gamification_System SHALL use database constraints to prevent negative values
4. WHEN accessing gamification data, THE Gamification_System SHALL enforce Row Level Security policies
5. WHEN a user views their own gamification data, THE Gamification_System SHALL allow read access
6. WHEN a user views another user's gamification data, THE Gamification_System SHALL allow read access only to public fields
7. WHEN a user attempts to modify gamification data directly, THE Gamification_System SHALL deny the request
8. WHEN awarding points through database functions, THE Gamification_System SHALL use SECURITY DEFINER to ensure proper authorization
9. WHEN calculating leaderboard rankings, THE Gamification_System SHALL prevent SQL injection through parameterized queries
10. WHEN storing sensitive gamification settings, THE Gamification_System SHALL encrypt preference data

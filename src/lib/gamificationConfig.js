/**
 * Gamification System Configuration
 * 
 * This file contains all badge definitions, point rules, level calculations,
 * and feature unlocks for the SkillSwap gamification system.
 */

// Task 7.1: Badge Definitions
// Maps badge types to their metadata including title, description, icon, rarity, and category
export const BADGE_DEFINITIONS = {
  // Trade milestone badges
  first_trade: {
    title: 'First Trade',
    description: 'Completed your first skill exchange',
    icon: 'Handshake',
    rarity: 'common',
    category: 'milestone'
  },
  trader: {
    title: 'Trader',
    description: 'Completed 10 skill exchanges',
    icon: 'TrendingUp',
    rarity: 'common',
    category: 'milestone'
  },
  master_trader: {
    title: 'Master Trader',
    description: 'Completed 50 skill exchanges',
    icon: 'Award',
    rarity: 'rare',
    category: 'milestone'
  },
  legend: {
    title: 'Legend',
    description: 'Completed 100 skill exchanges',
    icon: 'Crown',
    rarity: 'legendary',
    category: 'milestone'
  },
  
  // Category specialist badges
  tech_master: {
    title: 'Tech Master',
    description: 'Completed 10 trades in Tech category',
    icon: 'Code',
    rarity: 'rare',
    category: 'specialist'
  },
  arts_guru: {
    title: 'Arts Guru',
    description: 'Completed 10 trades in Arts category',
    icon: 'Palette',
    rarity: 'rare',
    category: 'specialist'
  },
  academic_helper: {
    title: 'Academic Helper',
    description: 'Completed 10 trades in Academic category',
    icon: 'GraduationCap',
    rarity: 'rare',
    category: 'specialist'
  },
  life_skills_expert: {
    title: 'Life Skills Expert',
    description: 'Completed 10 trades in Life Skills category',
    icon: 'Heart',
    rarity: 'rare',
    category: 'specialist'
  },
  
  // Special badges
  early_adopter: {
    title: 'Early Adopter',
    description: 'One of the first 100 users',
    icon: 'Rocket',
    rarity: 'epic',
    category: 'special'
  },
  helpful_mentor: {
    title: 'Helpful Mentor',
    description: 'Helped 25 different users',
    icon: 'Users',
    rarity: 'epic',
    category: 'special'
  },
  quick_responder: {
    title: 'Quick Responder',
    description: 'Average response time under 1 hour',
    icon: 'Zap',
    rarity: 'rare',
    category: 'special'
  }
};

// Task 7.2: Point Rules
// Maps action types to their point values
export const POINT_RULES = {
  skill_created: 10,
  trade_completed_provider: 50,
  trade_completed_requester: 30,
  positive_feedback: 20,
  streak_7_days: 100,
  streak_30_days: 500
};

// Task 7.3: Level Calculation Utility Functions

/**
 * Calculate user level based on total points
 * Formula: level = floor(sqrt(total_points / 100)) + 1
 * 
 * @param {number} totalPoints - The user's total accumulated points
 * @returns {number} The calculated level (minimum 1)
 * 
 * Examples:
 * - 0-99 points = Level 1
 * - 100-399 points = Level 2
 * - 400-899 points = Level 3
 * - 900-1599 points = Level 4
 */
export function calculateLevel(totalPoints) {
  if (totalPoints < 0) return 1;
  return Math.floor(Math.sqrt(totalPoints / 100)) + 1;
}

/**
 * Calculate points required to reach a specific level
 * Formula: points = level^2 * 100
 * 
 * @param {number} level - The target level
 * @returns {number} Total points needed to reach that level
 * 
 * Examples:
 * - Level 1: 0 points (starting level)
 * - Level 2: 100 points
 * - Level 3: 400 points
 * - Level 4: 900 points
 * - Level 5: 1600 points
 */
export function pointsForLevel(level) {
  if (level <= 1) return 0;
  return level * level * 100;
}

/**
 * Calculate points needed to reach the next level
 * 
 * @param {number} totalPoints - The user's current total points
 * @param {number} currentLevel - The user's current level
 * @returns {number} Points remaining until next level
 * 
 * Example:
 * - User has 250 points at Level 2
 * - Level 3 requires 400 points
 * - Returns: 150 points to next level
 */
export function pointsToNextLevel(totalPoints, currentLevel) {
  const nextLevel = currentLevel + 1;
  const pointsNeeded = pointsForLevel(nextLevel);
  return Math.max(0, pointsNeeded - totalPoints);
}

// Task 7.4: Level Unlocks
// Maps level numbers to arrays of unlocked features
export const LEVEL_UNLOCKS = {
  1: ['Basic profile', 'Create skills', 'Request trades'],
  5: ['Featured skill posts'],
  10: ['Priority search placement'],
  15: ['Custom profile theme'],
  20: ['Custom badge colors'],
  25: ['Exclusive leaderboard badge'],
  30: ['Profile verification badge']
};

/**
 * Get all features unlocked at a specific level
 * 
 * @param {number} level - The level to check
 * @returns {string[]} Array of feature descriptions unlocked at that level
 */
export function getFeaturesForLevel(level) {
  return LEVEL_UNLOCKS[level] || [];
}

/**
 * Get all features unlocked up to and including a specific level
 * 
 * @param {number} level - The user's current level
 * @returns {string[]} Array of all unlocked features
 */
export function getAllUnlockedFeatures(level) {
  const features = [];
  for (let i = 1; i <= level; i++) {
    if (LEVEL_UNLOCKS[i]) {
      features.push(...LEVEL_UNLOCKS[i]);
    }
  }
  return features;
}

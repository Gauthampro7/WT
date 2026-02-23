import { supabase } from '../lib/supabase';

export const gamificationService = {
  /**
   * Get user's gamification stats
   * Requirements: 1.13, 2.7-2.8, 4.6, 5.5-5.6
   * 
   * @param {string} userId - The user's UUID
   * @returns {Promise<Object>} Combined stats object with level, points, streak, and badges
   */
  async getUserStats(userId) {
    // Query users table for level, total_points, points_to_next_level
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('level, total_points, points_to_next_level')
      .eq('id', userId)
      .single();
    
    if (userError) {
      throw new Error(userError.message);
    }
    
    // Query user_streaks for current_streak, longest_streak, freeze_count
    const { data: streak, error: streakError } = await supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, freeze_count')
      .eq('user_id', userId)
      .single();
    
    // Note: streakError might occur if user has no streak record yet (new user)
    // This is expected, so we handle it gracefully by using default values
    
    // Query user_badges for all earned badges
    const { data: badges, error: badgesError } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    
    if (badgesError) {
      throw new Error(badgesError.message);
    }
    
    // Return combined stats object
    return {
      level: user.level,
      totalPoints: user.total_points,
      pointsToNextLevel: user.points_to_next_level,
      currentStreak: streak?.current_streak || 0,
      longestStreak: streak?.longest_streak || 0,
      freezeCount: streak?.freeze_count || 0,
      badges: badges || []
    };
  },

  /**
   * Get user's point transaction history
   * Requirements: 2.9
   * 
   * @param {string} userId - The user's UUID
   * @param {number} limit - Maximum number of transactions to return (default 20)
   * @returns {Promise<Array>} Array of point transactions ordered by most recent
   */
  async getPointHistory(userId, limit = 20) {
    const { data, error } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  /**
   * Update user's streak
   * Requirements: 4.1-4.12
   * 
   * @param {string} userId - The user's UUID
   * @returns {Promise<void>}
   */
  async updateStreak(userId) {
    const { error } = await supabase.rpc('update_streak', {
      p_user_id: userId
    });
    
    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Get leaderboard
   * Requirements: 3.1-3.6, 3.9
   * 
   * @param {Object} filters - Optional filters for leaderboard
   * @param {string} filters.university - Filter by university (optional)
   * @returns {Promise<Array>} Array of top 100 users with rank
   */
  async getLeaderboard(filters = {}) {
    let query = supabase
      .from('leaderboard_cache')
      .select('*');
    
    if (filters.university && filters.university !== 'All') {
      query = query.eq('university', filters.university);
    }
    
    query = query.limit(100);
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  /**
   * Get user's rank in leaderboard
   * Requirements: 3.7
   * 
   * @param {string} userId - The user's UUID
   * @returns {Promise<number|null>} User's rank or null if not in leaderboard
   */
  async getUserRank(userId) {
    const { data, error } = await supabase
      .from('leaderboard_cache')
      .select('rank')
      .eq('id', userId)
      .single();
    
    if (error) {
      // User not in leaderboard (no points or not in top rankings)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }
    
    return data.rank;
  },

  /**
   * Subscribe to real-time leaderboard updates
   * Requirements: 7.8
   * 
   * @param {Function} callback - Callback function to handle leaderboard changes
   * @returns {Object} Subscription object for cleanup
   */
  subscribeToLeaderboard(callback) {
    return supabase
      .channel('leaderboard_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: 'total_points=gt.0'
      }, callback)
      .subscribe();
  }
};

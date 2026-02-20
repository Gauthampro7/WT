import { supabase } from '../lib/supabase';

export const skillsService = {
  // Get all skills with filters
  async getSkills(filters = {}) {
    let query = supabase
      .from('skills')
      .select(`
        *,
        user:users(id, name, email, picture, university, location)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.category && filters.category !== 'All') {
      query = query.eq('category', filters.category);
    }

    if (filters.type && filters.type !== 'All') {
      query = query.eq('type', filters.type);
    }

    // Apply search
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Transform data to match frontend format
    return data.map((skill) => ({
      id: skill.id,
      title: skill.title,
      description: skill.description,
      category: skill.category,
      type: skill.type,
      location: skill.location,
      user: skill.user?.name || 'Unknown',
      user_id: skill.user_id,
      userData: skill.user,
      createdAt: skill.created_at,
    }));
  },

  // Get single skill
  async getSkill(id) {
    const { data, error } = await supabase
      .from('skills')
      .select(`
        *,
        user:users(id, name, email, picture, university, location)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      type: data.type,
      location: data.location,
      user: data.user?.name || 'Unknown',
      user_id: data.user_id,
      userData: data.user,
      createdAt: data.created_at,
    };
  },

  // Create skill
  async createSkill(skillData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be logged in to create a skill');
    }

    const { data, error } = await supabase
      .from('skills')
      .insert({
        title: skillData.title,
        description: skillData.description,
        category: skillData.category,
        type: skillData.type,
        location: skillData.location || '',
        user_id: user.id,
        status: 'active',
      })
      .select(`
        *,
        user:users(id, name, email, picture, university, location)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      type: data.type,
      location: data.location,
      user: data.user?.name || 'Unknown',
      user_id: data.user_id,
      userData: data.user,
      createdAt: data.created_at,
    };
  },

  // Update skill
  async updateSkill(id, updates) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be logged in to update a skill');
    }

    // Check ownership
    const { data: skill } = await supabase
      .from('skills')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!skill) {
      throw new Error('Skill not found');
    }

    if (skill.user_id !== user.id) {
      throw new Error('You can only update your own skills');
    }

    const { data, error } = await supabase
      .from('skills')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        user:users(id, name, email, picture, university, location)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      type: data.type,
      location: data.location,
      user: data.user?.name || 'Unknown',
      user_id: data.user_id,
      userData: data.user,
      createdAt: data.created_at,
    };
  },

  // Delete skill
  async deleteSkill(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be logged in to delete a skill');
    }

    // Check ownership
    const { data: skill } = await supabase
      .from('skills')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!skill) {
      throw new Error('Skill not found');
    }

    if (skill.user_id !== user.id) {
      throw new Error('You can only delete your own skills');
    }

    const { error } = await supabase.from('skills').delete().eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  // Request trade
  async requestTrade(skillId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be logged in to request a trade');
    }

    // Get skill to check ownership
    const { data: skill } = await supabase
      .from('skills')
      .select('user_id')
      .eq('id', skillId)
      .single();

    if (!skill) {
      throw new Error('Skill not found');
    }

    if (skill.user_id === user.id) {
      throw new Error('Cannot request trade for your own skill');
    }

    // In a real app, you'd create a trade request record here
    // For now, we'll just return success
    return { success: true, message: 'Trade request sent successfully' };
  },
};

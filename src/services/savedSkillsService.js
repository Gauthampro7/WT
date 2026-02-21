import { supabase } from '../lib/supabase';

export const savedSkillsService = {
  async getSavedIds() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('saved_skills')
      .select('skill_id')
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);
    return (data || []).map((r) => r.skill_id);
  },

  async getSavedSkills() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('saved_skills')
      .select(
        `
        skill_id,
        created_at,
        skill:skills(
          id, title, description, category, type, location, status, user_id,
          user:users(id, name, email, picture, university, location)
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || [])
      .filter((row) => row.skill && row.skill.status === 'active')
      .map((row) => ({
        id: row.skill.id,
        title: row.skill.title,
        description: row.skill.description,
        category: row.skill.category,
        type: row.skill.type,
        location: row.skill.location,
        user: row.skill.user?.name || 'Unknown',
        user_id: row.skill.user_id,
        userData: row.skill.user,
        createdAt: row.skill.created_at,
      }));
  },

  async save(skillId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to save skills');

    const { error } = await supabase
      .from('saved_skills')
      .insert({ user_id: user.id, skill_id: skillId });

    if (error) {
      if (error.code === '23505') return; // already saved
      throw new Error(error.message);
    }
  },

  async unsave(skillId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in');

    const { error } = await supabase
      .from('saved_skills')
      .delete()
      .eq('user_id', user.id)
      .eq('skill_id', skillId);

    if (error) throw new Error(error.message);
  },
};

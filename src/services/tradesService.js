import { supabase } from '../lib/supabase';

function mapTradeRequest(row) {
  return {
    id: row.id,
    skillId: row.skill_id,
    requesterId: row.requester_id,
    status: row.status,
    message: row.message || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    skill: row.skill
      ? {
          id: row.skill.id,
          title: row.skill.title,
          description: row.skill.description,
          category: row.skill.category,
          type: row.skill.type,
          location: row.skill.location,
          user: row.skill.user?.name || 'Unknown',
          userData: row.skill.user,
        }
      : null,
    requester: row.requester
      ? {
          id: row.requester.id,
          name: row.requester.name,
          email: row.requester.email,
          picture: row.requester.picture,
          location: row.requester.location,
        }
      : null,
  };
}

export const tradesService = {
  /** Create a trade request (request someone's skill) */
  async create(skillId, message = '') {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to request a trade');

    const { data: skill } = await supabase
      .from('skills')
      .select('user_id')
      .eq('id', skillId)
      .single();
    if (!skill) throw new Error('Skill not found');
    if (skill.user_id === user.id) throw new Error('Cannot request trade for your own skill');

    const { data, error } = await supabase
      .from('trade_requests')
      .insert({
        skill_id: skillId,
        requester_id: user.id,
        status: 'pending',
        message: message || '',
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('You have already requested this skill');
      throw new Error(error.message);
    }

    const { data: skillData } = await supabase
      .from('skills')
      .select(
        `id, title, description, category, type, location,
        user:users(id, name, email, picture, university, location)`
      )
      .eq('id', skillId)
      .single();

    return mapTradeRequest({
      ...data,
      skill: skillData,
      requester: {
        id: user.id,
        name: user.user_metadata?.name,
        email: user.email,
        picture: user.user_metadata?.picture,
      },
    });
  },

  /** Requests I sent (outgoing) */
  async getMyRequests() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in');

    const { data, error } = await supabase
      .from('trade_requests')
      .select(
        `*,
        skill:skills(id, title, description, category, type, location, user:users(id, name, email, picture, university, location))`
      )
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row) =>
      mapTradeRequest({
        ...row,
        requester: {
          id: user.id,
          name: user.user_metadata?.name,
          email: user.email,
          picture: user.user_metadata?.picture,
        },
      })
    );
  },

  /** Requests on my skills (incoming) */
  async getIncomingRequests() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in');

    const { data: mySkills } = await supabase
      .from('skills')
      .select('id')
      .eq('user_id', user.id);
    if (!mySkills?.length) return [];

    const skillIds = mySkills.map((s) => s.id);
    const { data, error } = await supabase
      .from('trade_requests')
      .select(
        `*,
        skill:skills(id, title, description, category, type, location, user:users(id, name, email, picture, university, location)),
        requester:users(id, name, email, picture, university, location)`
      )
      .in('skill_id', skillIds)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapTradeRequest);
  },

  /** Accept a trade request (as skill owner) */
  async accept(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in');

    const { data: req } = await supabase
      .from('trade_requests')
      .select('skill_id, status')
      .eq('id', id)
      .single();
    if (!req) throw new Error('Request not found');
    if (req.status !== 'pending') throw new Error('Request is no longer pending');

    const { data: skill } = await supabase
      .from('skills')
      .select('user_id')
      .eq('id', req.skill_id)
      .single();
    if (skill.user_id !== user.id) throw new Error('You can only accept requests on your own skills');

    const { data, error } = await supabase
      .from('trade_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /** Decline a trade request (as skill owner) */
  async decline(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in');

    const { data: req } = await supabase
      .from('trade_requests')
      .select('skill_id, status')
      .eq('id', id)
      .single();
    if (!req) throw new Error('Request not found');
    if (req.status !== 'pending') throw new Error('Request is no longer pending');

    const { data: skill } = await supabase
      .from('skills')
      .select('user_id')
      .eq('id', req.skill_id)
      .single();
    if (skill.user_id !== user.id) throw new Error('You can only decline requests on your own skills');

    const { data, error } = await supabase
      .from('trade_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /** Cancel a trade request (as requester) */
  async cancel(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in');

    const { data: req } = await supabase
      .from('trade_requests')
      .select('requester_id, status')
      .eq('id', id)
      .single();
    if (!req) throw new Error('Request not found');
    if (req.requester_id !== user.id) throw new Error('You can only cancel your own requests');
    if (req.status !== 'pending') throw new Error('Only pending requests can be cancelled');

    const { error } = await supabase
      .from('trade_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};

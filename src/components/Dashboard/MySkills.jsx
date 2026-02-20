import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Loader2, Briefcase } from 'lucide-react';
import { skillsService } from '../../services/skillsService';
import { CreateSkillModal } from '../CreateSkillModal';

const CATEGORIES = ['Tech', 'Arts', 'Academic', 'Life Skills'];
const TYPES = ['Offering', 'Seeking'];

export function MySkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'Tech', type: 'Offering', location: '' });

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await skillsService.getMySkills();
      setSkills(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this skill?')) return;
    try {
      await skillsService.deleteSkill(id);
      await fetchSkills();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (skill) => {
    setEditing(skill.id);
    setForm({
      title: skill.title,
      description: skill.description,
      category: skill.category,
      type: skill.type,
      location: skill.location || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      await skillsService.updateSkill(editing, form);
      setEditing(null);
      setForm({ title: '', description: '', category: 'Tech', type: 'Offering', location: '' });
      await fetchSkills();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-accent-theme animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-theme">My Skills</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 glass px-4 py-2 rounded-lg text-theme hover:bg-accent-theme/10 font-medium"
        >
          <Briefcase size={18} />
          Add Skill
        </motion.button>
      </div>

      {error && (
        <div className="glass p-4 rounded-xl border border-red-500/30 text-red-400">{error}</div>
      )}

      {skills.length === 0 && !error ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-theme-secondary mb-4">You haven’t posted any skills yet.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 rounded-lg bg-accent-theme text-white font-medium"
          >
            Add your first skill
          </motion.button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill, i) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-5"
            >
              {editing === skill.id ? (
                <div className="space-y-3">
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 glass rounded-lg text-theme text-sm"
                    placeholder="Title"
                  />
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 glass rounded-lg text-theme text-sm resize-none"
                    placeholder="Description"
                  />
                  <div className="flex gap-2">
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="flex-1 px-3 py-2 glass rounded-lg text-theme text-sm"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      className="flex-1 px-3 py-2 glass rounded-lg text-theme text-sm"
                    >
                      {TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full px-3 py-2 glass rounded-lg text-theme text-sm"
                    placeholder="Location"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 py-2 rounded-lg bg-accent-theme text-white text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="flex-1 py-2 rounded-lg glass text-theme text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent-theme/20 text-accent-theme">
                      {skill.category}
                    </span>
                    <span className="text-xs text-theme-secondary">{skill.type}</span>
                  </div>
                  <h3 className="font-bold text-theme mb-1">{skill.title}</h3>
                  <p className="text-sm text-theme-secondary line-clamp-2 mb-3">{skill.description}</p>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(skill)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg glass text-theme text-sm"
                    >
                      <Edit2 size={14} />
                      Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(skill.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg glass text-red-400 text-sm hover:bg-red-500/10"
                    >
                      <Trash2 size={14} />
                      Delete
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <CreateSkillModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          fetchSkills();
        }}
      />
    </div>
  );
}

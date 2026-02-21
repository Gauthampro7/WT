import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Loader2 } from 'lucide-react';
import { savedSkillsService } from '../../services/savedSkillsService';
import { SkillCard } from '../SkillCard';

export function SavedSkills({ onRequestTrade, onUnsave, savedIds, refreshSavedIds }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSaved = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await savedSkillsService.getSavedSkills();
      setSkills(data);
      refreshSavedIds?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-accent-theme animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-theme">Saved skills</h2>
      <p className="text-sm text-theme-secondary">
        Skills you bookmarked. Request a trade or remove from saved.
      </p>

      {error && (
        <div className="glass p-4 rounded-xl border border-red-500/30 text-red-400">{error}</div>
      )}

      {skills.length === 0 && !error ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Bookmark className="w-12 h-12 text-theme-secondary mx-auto mb-4 opacity-60" />
          <p className="text-theme-secondary">No saved skills yet.</p>
          <p className="text-sm text-theme-secondary mt-1">Click the bookmark on any skill card to save it.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill, index) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              index={index}
              onRequestTrade={onRequestTrade}
              isSaved={true}
              onUnsave={async (id) => {
                await savedSkillsService.unsave(id);
                onUnsave?.(id);
                fetchSaved();
              }}
              onUserClick={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}

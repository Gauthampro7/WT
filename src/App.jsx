import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeSelector } from './components/ThemeSelector';
import { LoginButton } from './components/LoginButton';
import { SearchFilter } from './components/SearchFilter';
import { BentoGrid } from './components/BentoGrid';
import { SkillCard } from './components/SkillCard';
import { TradeModal } from './components/TradeModal';
import { CreateSkillModal } from './components/CreateSkillModal';
import { skillsService } from './services/skillsService';
import { Sparkles, Plus, Loader2 } from 'lucide-react';

function AppContent() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ category: 'All', type: 'All' });
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch skills from API
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedSkills = await skillsService.getSkills({
          search: searchQuery,
          category: filters.category,
          type: filters.type,
        });
        setSkills(fetchedSkills);
      } catch (err) {
        console.error('Error fetching skills:', err);
        setError(err.message || 'Failed to load skills');
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [searchQuery, filters.category, filters.type]);

  const filteredSkills = useMemo(() => {
    // Additional client-side filtering if needed
    return skills;
  }, [skills]);

  const handleRequestTrade = async (skill) => {
    try {
      await skillsService.requestTrade(skill.id);
      setSelectedSkill(skill);
      setIsModalOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to request trade');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedSkill(null), 300);
  };

  const handleCreateSuccess = () => {
    // Refresh skills list
    const fetchSkills = async () => {
      try {
        const fetchedSkills = await skillsService.getSkills({
          search: searchQuery,
          category: filters.category,
          type: filters.type,
        });
        setSkills(fetchedSkills);
      } catch (err) {
        console.error('Error fetching skills:', err);
      }
    };
    fetchSkills();
  };

  return (
    <div className="min-h-screen bg-theme transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-theme backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-accent-theme/20 rounded-lg blur-lg" />
                <div className="relative bg-accent-theme/10 p-2 rounded-lg">
                  <Sparkles className="text-accent-theme" size={24} />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-theme">SkillSwap</h1>
                <p className="text-xs text-theme-secondary">Exchange skills with students</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <LoginButton />
              <ThemeSelector />
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <SearchFilter
            onSearch={setSearchQuery}
            onFilterChange={setFilters}
          />
        </motion.div>

        {/* Results Count and Create Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex items-center justify-between"
        >
          <p className="text-theme-secondary">
            {loading ? 'Loading...' : `${filteredSkills.length} ${filteredSkills.length === 1 ? 'skill' : 'skills'} found`}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 glass px-4 py-2 rounded-lg text-theme hover:bg-accent-theme/10 transition-colors font-medium"
          >
            <Plus size={18} />
            Create Skill
          </motion.button>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 glass p-4 rounded-xl border border-red-500/30"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent-theme animate-spin" />
          </div>
        )}

        {/* Skills Grid */}
        {!loading && filteredSkills.length > 0 ? (
          <BentoGrid>
            {filteredSkills.map((skill, index) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                index={index}
                onRequestTrade={handleRequestTrade}
              />
            ))}
          </BentoGrid>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="glass rounded-2xl p-12 max-w-md mx-auto">
              <p className="text-2xl font-bold text-theme mb-2">No skills found</p>
              <p className="text-theme-secondary">
                Try adjusting your search or filters
              </p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Trade Modal */}
      <TradeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        skill={selectedSkill}
      />

      {/* Create Skill Modal */}
      <CreateSkillModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

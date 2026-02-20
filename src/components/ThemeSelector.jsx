import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Palette } from 'lucide-react';
import { motion } from 'framer-motion';

export const ThemeSelector = () => {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="glass p-3 rounded-full text-theme hover:bg-accent-theme/10 transition-colors"
        aria-label="Change theme"
      >
        <Palette size={20} />
      </motion.button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-12 z-50 glass rounded-xl p-2 min-w-[150px]"
          >
            {themes.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTheme(t);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg capitalize transition-colors ${
                  theme === t
                    ? 'bg-accent-theme text-white'
                    : 'text-theme hover:bg-accent-theme/10'
                }`}
              >
                {t}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};

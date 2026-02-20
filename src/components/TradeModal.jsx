import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Sparkles, LayoutDashboard } from 'lucide-react';
import confetti from 'canvas-confetti';

export const TradeModal = ({ isOpen, onClose, skill, onViewDashboard }) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    }
  }, [isOpen]);

  if (!skill) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass rounded-3xl p-8 max-w-md w-full relative overflow-hidden">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-theme-secondary hover:text-theme transition-colors"
              >
                <X size={24} />
              </button>

              {/* Content */}
              <div className="text-center space-y-6">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="flex justify-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-accent-theme/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative bg-accent-theme/10 p-4 rounded-full">
                      <Sparkles className="text-accent-theme" size={48} />
                    </div>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-theme"
                >
                  Trade Request Sent!
                </motion.h2>

                {/* Skill Info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <p className="text-theme-secondary">
                    You've requested to trade for:
                  </p>
                  <div className="glass rounded-xl p-4">
                    <h3 className="text-xl font-bold text-theme mb-1">{skill.title}</h3>
                    <p className="text-sm text-theme-secondary">{skill.description}</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-accent-theme/20 text-accent-theme">
                        {skill.category}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                        {skill.type}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-theme-secondary text-sm"
                >
                  Track status in your Dashboard under &quot;Requests I sent&quot;.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 px-6 py-3 glass text-theme rounded-xl font-semibold"
                  >
                    Got it!
                  </motion.button>
                  {onViewDashboard && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onClose();
                        onViewDashboard();
                      }}
                      className="flex-1 px-6 py-3 bg-accent-theme text-white rounded-xl font-semibold hover:glow-theme transition-all flex items-center justify-center gap-2"
                    >
                      <LayoutDashboard size={20} />
                      View in Dashboard
                    </motion.button>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

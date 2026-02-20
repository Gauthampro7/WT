import { motion } from 'framer-motion';
import { ArrowRight, User, MapPin } from 'lucide-react';
import { useState } from 'react';

export const SkillCard = ({ skill, index, onRequestTrade }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const getCategoryColor = (category) => {
    const colors = {
      Tech: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      Arts: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      Academic: 'bg-green-500/20 text-green-400 border-green-500/30',
      'Life Skills': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className="glass-card rounded-2xl p-6 cursor-pointer group relative overflow-hidden"
      style={{
        perspective: '1000px',
      }}
    >
      <motion.div
        animate={{
          rotateX: isHovered ? mousePosition.y * -10 : 0,
          rotateY: isHovered ? mousePosition.x * 10 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Card Content */}
        <div className="flex flex-col h-full">
          {/* Badge */}
          <div className="flex items-center justify-between mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(
                skill.category
              )}`}
            >
              {skill.category}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                skill.type === 'Offering'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {skill.type}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-theme mb-2">{skill.title}</h3>

          {/* Description */}
          <p className="text-theme-secondary text-sm mb-4 flex-grow">
            {skill.description}
          </p>

          {/* User Info */}
          <div className="flex items-center gap-3 mb-4 text-theme-secondary text-sm">
            <div className="flex items-center gap-1">
              <User size={16} />
              <span>{skill.userData?.name || skill.user || 'Unknown'}</span>
            </div>
            {(skill.location || skill.userData?.location) && (
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{skill.location || skill.userData?.location}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onRequestTrade(skill);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent-theme text-white font-semibold transition-all group-hover:glow-theme"
          >
            Request Trade
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </motion.div>

      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${isHovered ? '50%' : '0%'} 50%, var(--glow) 0%, transparent 70%)`,
        }}
      />
    </motion.div>
  );
};

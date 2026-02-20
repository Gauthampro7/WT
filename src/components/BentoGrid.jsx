import { motion } from 'framer-motion';

export const BentoGrid = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {children}
    </div>
  );
};

export const BentoCard = ({ children, className = '', span = 1 }) => {
  return (
    <motion.div
      className={`glass-card rounded-2xl p-6 ${className}`}
      style={{ gridColumn: `span ${span}` }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

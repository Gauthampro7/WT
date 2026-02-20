import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginButton = () => {
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  const [authError, setAuthError] = useState(null);

  if (loading) {
    return (
      <div className="glass p-2 rounded-lg">
        <div className="w-6 h-6 border-2 border-accent-theme border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col items-end gap-2">
        {authError && (
          <div className="flex items-center gap-2 glass px-3 py-2 rounded-lg text-red-400 text-sm max-w-xs" role="alert">
            <AlertCircle size={16} className="shrink-0" />
            <span>{authError}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 glass px-4 py-2 rounded-lg"
        >
          {user.user_metadata?.picture ? (
            <img
              src={user.user_metadata.picture}
              alt={user.user_metadata.name || 'User'}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent-theme/20 flex items-center justify-center">
              <User size={16} className="text-accent-theme" />
            </div>
          )}
          <span className="text-sm font-medium text-theme hidden sm:block">
            {user.user_metadata?.name || user.email}
          </span>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            setAuthError(null);
            try {
              await signOut();
            } catch (err) {
              setAuthError(err?.message || 'Failed to sign out');
            }
          }}
          className="glass px-4 py-2 rounded-lg text-theme hover:bg-accent-theme/10 transition-colors text-sm font-medium"
        >
          Logout
        </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {authError && (
        <div className="flex items-center gap-2 glass px-3 py-2 rounded-lg text-red-400 text-sm max-w-xs" role="alert">
          <AlertCircle size={16} className="shrink-0" />
          <span>{authError}</span>
        </div>
      )}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={async () => {
          setAuthError(null);
          try {
            await signInWithGoogle();
          } catch (err) {
            setAuthError(err?.message || 'Failed to sign in with Google');
          }
        }}
        className="flex items-center gap-2 glass px-4 py-2 rounded-lg text-theme hover:bg-accent-theme/10 transition-colors"
      >
        <LogIn size={18} />
        <span className="font-medium">Login with Google</span>
      </motion.button>
    </div>
  );
};

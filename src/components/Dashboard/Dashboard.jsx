import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Briefcase, Send, Inbox, Compass } from 'lucide-react';
import { MySkills } from './MySkills';
import { MyRequests } from './MyRequests';
import { IncomingRequests } from './IncomingRequests';
import { useAuth } from '../../contexts/AuthContext';

const TABS = [
  { id: 'my-skills', label: 'My Skills', icon: Briefcase },
  { id: 'my-requests', label: 'Requests I sent', icon: Send },
  { id: 'incoming', label: 'Requests I received', icon: Inbox },
];

export function Dashboard({ onGoToBrowse }) {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState('my-skills');

  if (!isAuthenticated) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <LayoutDashboard className="w-12 h-12 text-theme-secondary mx-auto mb-4 opacity-60" />
        <p className="text-theme mb-2">Log in to see your dashboard</p>
        <p className="text-sm text-theme-secondary">My Skills, your requests, and incoming requests appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-theme flex items-center gap-2">
          <LayoutDashboard size={28} />
          Dashboard
        </h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGoToBrowse}
          className="flex items-center gap-2 glass px-4 py-2 rounded-lg text-theme hover:bg-accent-theme/10 font-medium"
        >
          <Compass size={18} />
          Browse skills
        </motion.button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-theme pb-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-accent-theme text-white'
                  : 'glass text-theme hover:bg-accent-theme/10'
              }`}
            >
              <Icon size={18} />
              {t.label}
            </motion.button>
          );
        })}
      </div>

      {tab === 'my-skills' && <MySkills />}
      {tab === 'my-requests' && <MyRequests />}
      {tab === 'incoming' && <IncomingRequests />}
    </div>
  );
}

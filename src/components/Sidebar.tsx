import React, { useEffect, useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, PlusCircle, History, BarChart3, LogOut, User as UserIcon, BrainCircuit, Trophy, Medal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AchievementsModal } from './AchievementsModal';
import { evaluateUserBadges } from '../utils/achievements';
import { QuizHistoryItem } from '../types';
import api from '../api/client';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/quizzes/history');
      setHistory(res.data.history || []);
    } catch (err) {
      console.error('Failed to load sidebar history for achievements:', err);
    }
  };

  const badgeStatuses = useMemo(() => evaluateUserBadges(history), [history]);
  const unlockedBadgesCount = useMemo(
    () => badgeStatuses.filter((b) => b.unlocked).length,
    [badgeStatuses]
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <aside className="w-64 border-r border-zinc-800/80 flex flex-col bg-[#0C0C0E] h-screen sticky top-0 shrink-0">
        {/* Brand Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600/90 hover:bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 transition-colors">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-zinc-100 flex items-center gap-1.5">
              QuizGen<span className="text-indigo-400 font-medium text-xs px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">AI</span>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 mt-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`
            }
          >
            <PlusCircle className="w-4 h-4" />
            Create New Quiz
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`
            }
          >
            <History className="w-4 h-4" />
            Quiz History
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`
            }
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </NavLink>

          {/* Achievements Nav Item */}
          <button
            type="button"
            onClick={() => setIsAchievementsOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Achievements</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
              {unlockedBadgesCount}/{badgeStatuses.length}
            </span>
          </button>
        </nav>

        {/* Profile Sidebar Achievements Card */}
        <div className="px-4 pb-2">
          <div
            onClick={() => setIsAchievementsOpen(true)}
            className="p-3 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-indigo-950/40 border border-amber-500/20 rounded-xl cursor-pointer hover:border-amber-500/40 transition-all group"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Medal className="w-3.5 h-3.5" /> Profile Badges
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold group-hover:text-amber-300 transition-colors">
                View All →
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Unlocked Badges:</span>
              <span className="font-mono font-extrabold text-amber-400">
                {unlockedBadgesCount} / {badgeStatuses.length}
              </span>
            </div>
          </div>
        </div>

        {/* Footer User Info */}
        <div className="p-4 border-t border-zinc-800/80">
          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0 uppercase">
                {user?.username ? user.username.slice(0, 2) : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-100 truncate">{user?.username || 'User'}</p>
                <p className="text-[11px] text-zinc-500 truncate">{user?.email || 'user@quizgen.ai'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Dedicated Achievements Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        history={history}
      />
    </>
  );
};


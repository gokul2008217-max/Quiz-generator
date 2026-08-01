import React, { useState, useMemo } from 'react';
import {
  X,
  Trophy,
  Award,
  Sparkles,
  BookOpen,
  Crown,
  Target,
  Zap,
  Flame,
  Compass,
  CheckCircle2,
  Lock,
  Filter,
  Medal,
  Check
} from 'lucide-react';
import { BADGES, evaluateUserBadges, UserBadgeStatus, Badge } from '../utils/achievements';
import { QuizHistoryItem } from '../types';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: QuizHistoryItem[];
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose, history }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const badgeStatuses = useMemo(() => evaluateUserBadges(history), [history]);

  const unlockedCount = useMemo(
    () => badgeStatuses.filter((s) => s.unlocked).length,
    [badgeStatuses]
  );

  const totalBadges = badgeStatuses.length;
  const completionPercentage = Math.round((unlockedCount / totalBadges) * 100);

  const filteredStatuses = useMemo(() => {
    return badgeStatuses.filter((item) => {
      const matchesTab =
        activeTab === 'all'
          ? true
          : activeTab === 'unlocked'
          ? item.unlocked
          : !item.unlocked;

      const matchesCategory =
        selectedCategory === 'all' ? true : item.badge.category === selectedCategory;

      return matchesTab && matchesCategory;
    });
  }, [badgeStatuses, activeTab, selectedCategory]);

  if (!isOpen) return null;

  const renderIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Compass':
        return <Compass className={className} />;
      case 'CheckCircle2':
        return <CheckCircle2 className={className} />;
      default:
        return <Medal className={className} />;
    }
  };

  const getRarityBadgeStyle = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'Legendary':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Epic':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Rare':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Milestones & Achievements
              </h2>
              <p className="text-xs text-zinc-400">
                Unlock badges as you complete quizzes and master topics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats Banner */}
        <div className="p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950/40 border-b border-zinc-800/80 space-y-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">Overall Progress</div>
              <div className="text-2xl font-black text-zinc-100 flex items-baseline gap-2 mt-0.5">
                <span>{unlockedCount} / {totalBadges}</span>
                <span className="text-xs font-semibold text-indigo-400">({completionPercentage}% unlocked)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 p-1.5 rounded-xl text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All ({totalBadges})
              </button>
              <button
                onClick={() => setActiveTab('unlocked')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'unlocked'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Unlocked ({unlockedCount})
              </button>
              <button
                onClick={() => setActiveTab('locked')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'locked'
                    ? 'bg-zinc-800 text-zinc-200 shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Locked ({totalBadges - unlockedCount})
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 h-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
            <span className="text-xs text-zinc-500 font-medium shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Category:
            </span>
            {['all', 'completion', 'accuracy', 'speed', 'mastery'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-zinc-800 text-indigo-300 border border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          {filteredStatuses.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs space-y-2">
              <Trophy className="w-10 h-10 mx-auto text-zinc-700" />
              <p className="font-semibold text-zinc-400">No badges match the selected filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredStatuses.map(({ badge, unlocked, progress, target }) => {
                const pct = Math.round((progress / target) * 100);

                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 relative overflow-hidden ${
                      unlocked
                        ? `bg-gradient-to-br ${badge.gradient} ${badge.borderColor} shadow-lg hover:border-zinc-500/50`
                        : 'bg-zinc-950/60 border-zinc-800/80 opacity-70 grayscale hover:grayscale-0 hover:opacity-90'
                    }`}
                  >
                    {/* Badge Icon */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${
                        unlocked
                          ? `${badge.textColor} ${badge.borderColor} bg-zinc-950/80`
                          : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                      }`}
                    >
                      {unlocked ? (
                        renderIcon(badge.icon, 'w-6 h-6')
                      ) : (
                        <Lock className="w-5 h-5 text-zinc-600" />
                      )}
                    </div>

                    {/* Badge Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-sm font-bold truncate ${
                            unlocked ? 'text-zinc-100' : 'text-zinc-400'
                          }`}
                        >
                          {badge.title}
                        </h4>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${getRarityBadgeStyle(
                            badge.rarity
                          )}`}
                        >
                          {badge.rarity}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        {badge.description}
                      </p>

                      {/* Progress Bar for Locked / Target Count */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                          <span>{unlocked ? 'Completed' : 'Progress'}</span>
                          <span className="font-mono font-bold">
                            {progress} / {target}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                          <div
                            className={`h-full transition-all duration-300 ${
                              unlocked
                                ? 'bg-emerald-500'
                                : 'bg-indigo-500/60'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Unlocked checkmark pill */}
                    {unlocked && (
                      <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 p-1 rounded-full">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span>Keep attempting quizzes to unlock all badges!</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors shadow"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import { QuizHistoryItem } from '../types';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon identifier
  category: 'completion' | 'accuracy' | 'speed' | 'mastery';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  gradient: string;
  borderColor: string;
  textColor: string;
  checkUnlocked: (history: QuizHistoryItem[]) => { unlocked: boolean; progress: number; target: number };
}

export const BADGES: Badge[] = [
  {
    id: 'first_quiz',
    title: 'First Steps',
    description: 'Complete your first quiz session',
    icon: 'Sparkles',
    category: 'completion',
    rarity: 'Common',
    gradient: 'from-blue-500/20 to-indigo-500/20',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    checkUnlocked: (history) => {
      const count = history.length;
      return { unlocked: count >= 1, progress: Math.min(count, 1), target: 1 };
    },
  },
  {
    id: 'five_quizzes',
    title: 'Quiz Enthusiast',
    description: 'Complete 5 quiz sessions',
    icon: 'BookOpen',
    category: 'completion',
    rarity: 'Common',
    gradient: 'from-indigo-500/20 to-purple-500/20',
    borderColor: 'border-indigo-500/30',
    textColor: 'text-indigo-400',
    checkUnlocked: (history) => {
      const count = history.length;
      return { unlocked: count >= 5, progress: Math.min(count, 5), target: 5 };
    },
  },
  {
    id: 'ten_quizzes',
    title: 'Master Quizzer',
    description: 'Complete 10 quiz sessions',
    icon: 'Award',
    category: 'completion',
    rarity: 'Rare',
    gradient: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    checkUnlocked: (history) => {
      const count = history.length;
      return { unlocked: count >= 10, progress: Math.min(count, 10), target: 10 };
    },
  },
  {
    id: 'twenty_five_quizzes',
    title: 'Quiz Legend',
    description: 'Complete 25 quiz sessions',
    icon: 'Crown',
    category: 'completion',
    rarity: 'Legendary',
    gradient: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    checkUnlocked: (history) => {
      const count = history.length;
      return { unlocked: count >= 25, progress: Math.min(count, 25), target: 25 };
    },
  },
  {
    id: 'perfect_score',
    title: 'Perfectionist',
    description: 'Achieve a 100% score on any quiz',
    icon: 'Trophy',
    category: 'accuracy',
    rarity: 'Epic',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    checkUnlocked: (history) => {
      const perfects = history.filter((item) => item.percentage === 100).length;
      return { unlocked: perfects >= 1, progress: Math.min(perfects, 1), target: 1 };
    },
  },
  {
    id: 'high_flier',
    title: 'High Achiever',
    description: 'Score 80%+ on 3 different quizzes',
    icon: 'Target',
    category: 'accuracy',
    rarity: 'Rare',
    gradient: 'from-teal-500/20 to-cyan-500/20',
    borderColor: 'border-teal-500/30',
    textColor: 'text-teal-400',
    checkUnlocked: (history) => {
      const highScores = history.filter((item) => item.percentage >= 80).length;
      return { unlocked: highScores >= 3, progress: Math.min(highScores, 3), target: 3 };
    },
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Complete a timed quiz in under 60 seconds',
    icon: 'Zap',
    category: 'speed',
    rarity: 'Epic',
    gradient: 'from-rose-500/20 to-orange-500/20',
    borderColor: 'border-rose-500/30',
    textColor: 'text-rose-400',
    checkUnlocked: (history) => {
      const speeds = history.filter((item) => item.timeTakenSeconds > 0 && item.timeTakenSeconds <= 60).length;
      return { unlocked: speeds >= 1, progress: Math.min(speeds, 1), target: 1 };
    },
  },
  {
    id: 'hardcore',
    title: 'Hardcore Scholar',
    description: 'Successfully complete a Hard difficulty quiz',
    icon: 'Flame',
    category: 'mastery',
    rarity: 'Rare',
    gradient: 'from-red-500/20 to-rose-500/20',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    checkUnlocked: (history) => {
      const hards = history.filter((item) => item.difficulty.toLowerCase() === 'hard').length;
      return { unlocked: hards >= 1, progress: Math.min(hards, 1), target: 1 };
    },
  },
  {
    id: 'polymath',
    title: 'Polymath Explorer',
    description: 'Complete quizzes across at least 3 distinct topics',
    icon: 'Compass',
    category: 'mastery',
    rarity: 'Rare',
    gradient: 'from-violet-500/20 to-fuchsia-500/20',
    borderColor: 'border-violet-500/30',
    textColor: 'text-violet-400',
    checkUnlocked: (history) => {
      const topics = new Set(history.map((item) => item.topic.toLowerCase().trim())).size;
      return { unlocked: topics >= 3, progress: Math.min(topics, 3), target: 3 };
    },
  },
  {
    id: 'century_club',
    title: 'Century Club',
    description: 'Answer 50 or more total questions',
    icon: 'CheckCircle2',
    category: 'completion',
    rarity: 'Epic',
    gradient: 'from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    checkUnlocked: (history) => {
      const totalQuestions = history.reduce((acc, item) => acc + (item.totalQuestions || 0), 0);
      return { unlocked: totalQuestions >= 50, progress: Math.min(totalQuestions, 50), target: 50 };
    },
  },
];

export interface UserBadgeStatus {
  badge: Badge;
  unlocked: boolean;
  progress: number;
  target: number;
}

export function evaluateUserBadges(history: QuizHistoryItem[]): UserBadgeStatus[] {
  return BADGES.map((badge) => {
    const status = badge.checkUnlocked(history);
    return {
      badge,
      unlocked: status.unlocked,
      progress: status.progress,
      target: status.target,
    };
  });
}

import React, { useEffect, useState, useMemo } from 'react';
import { BarChart3, Trophy, Clock, Target, Award, TrendingUp, Calendar, Sparkles, Brain, Medal, Lock, ChevronRight } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import api from '../api/client';
import { QuizHistoryItem } from '../types';
import { evaluateUserBadges } from '../utils/achievements';
import { AchievementsModal } from '../components/AchievementsModal';

export const Analytics: React.FC = () => {
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get<QuizHistoryItem[]>('/quiz/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to load analytics history:', err);
    } finally {
      setLoading(false);
    }
  };

  const badgeStatuses = useMemo(() => evaluateUserBadges(history), [history]);
  const unlockedBadges = useMemo(() => badgeStatuses.filter((b) => b.unlocked), [badgeStatuses]);

  const totalQuizzes = history.length;
  const avgScore = totalQuizzes
    ? Math.round(history.reduce((acc, curr) => acc + curr.percentage, 0) / totalQuizzes)
    : 0;
  const totalTimeSeconds = history.reduce((acc, curr) => acc + (curr.timeTakenSeconds || 0), 0);

  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

  // Group performance by topic
  const topicStats: Record<string, { attempts: number; totalPct: number }> = {};
  history.forEach((item) => {
    if (!topicStats[item.topic]) {
      topicStats[item.topic] = { attempts: 0, totalPct: 0 };
    }
    topicStats[item.topic].attempts += 1;
    topicStats[item.topic].totalPct += item.percentage;
  });

  const topicList = Object.entries(topicStats)
    .map(([topic, data]) => ({
      topic,
      attempts: data.attempts,
      avgPct: Math.round(data.totalPct / data.attempts),
    }))
    .sort((a, b) => b.avgPct - a.avgPct);

  // Prepare chronological chart data for score improvement line chart
  const chartData = useMemo(() => {
    const sorted = [...history].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const filtered =
      selectedTopicFilter === 'all'
        ? sorted
        : sorted.filter((item) => item.topic === selectedTopicFilter);

    return filtered.map((item, index) => {
      const dateObj = new Date(item.createdAt);
      const formattedDate = dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        attemptNumber: index + 1,
        label: `#${index + 1} (${formattedDate})`,
        score: item.percentage,
        topic: item.topic,
        difficulty: item.difficulty,
        rawScore: `${item.score}/${item.totalQuestions}`,
        date: formattedDate,
        time: formattedTime,
        createdAt: item.createdAt,
      };
    });
  }, [history, selectedTopicFilter]);

  // Unique topics list for filtering
  const uniqueTopics = useMemo(() => {
    const topicsSet = new Set(history.map((h) => h.topic));
    return Array.from(topicsSet);
  }, [history]);

  // Calculate improvement trend (first vs last attempt in filtered view)
  const scoreTrend = useMemo(() => {
    if (chartData.length < 2) return null;
    const firstScore = chartData[0].score;
    const latestScore = chartData[chartData.length - 1].score;
    const diff = latestScore - firstScore;
    return {
      diff,
      isPositive: diff >= 0,
      text: diff >= 0 ? `+${diff}% overall improvement` : `${diff}% change`,
    };
  }, [chartData]);

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 border-b border-zinc-800/80 pb-1.5">
            <span className="font-bold text-zinc-200">Attempt #{data.attemptNumber}</span>
            <span className="text-[10px] text-zinc-500 font-mono">{data.date} • {data.time}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-400">Topic:</span>
            <span className="text-zinc-200 font-medium truncate max-w-[160px]">{data.topic}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-400">Score Ratio:</span>
            <span className="font-mono text-zinc-300 font-semibold">{data.rawScore}</span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-zinc-800/80">
            <span className="text-zinc-400">Score Percentage:</span>
            <span
              className={`font-mono font-bold text-sm ${
                data.score >= 80
                  ? 'text-emerald-400'
                  : data.score >= 50
                  ? 'text-indigo-400'
                  : 'text-red-400'
              }`}
            >
              {data.score}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Performance & Analytics
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Real-time learning stats & score progression tracking</p>
        </div>
        <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Live Recharts Analytics</span>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Trophy className="w-5 h-5" />
          </div>
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Average Score</p>
          <p className="text-3xl font-extrabold text-zinc-100 font-mono">{avgScore}%</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Target className="w-5 h-5" />
          </div>
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Quizzes Completed</p>
          <p className="text-3xl font-extrabold text-zinc-100 font-mono">{totalQuizzes}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Time Spent</p>
          <p className="text-3xl font-extrabold text-zinc-100 font-mono">{formatTotalTime(totalTimeSeconds)}</p>
        </div>
      </div>

      {/* Badges & Achievements Showcase Banner */}
      <div className="bg-gradient-to-r from-amber-950/30 via-zinc-900 to-indigo-950/30 border border-amber-500/30 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
            <Medal className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-100">Milestones & Badge Achievements</h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
                {unlockedBadges.length} / {badgeStatuses.length} Unlocked
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-xl">
              Earn badges for completion milestones, high scores, perfect scores, speed runs, and topic mastery.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAchievementsModalOpen(true)}
          className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-600/20 shrink-0 w-full md:w-auto"
        >
          <Trophy className="w-4 h-4" />
          <span>View All Achievements</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Recharts Line Chart: Score Improvement Over Time */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Score Improvement Over Time
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Visualizing quiz percentage trends chronologically across completed attempts
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {scoreTrend && (
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  scoreTrend.isPositive
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}
              >
                {scoreTrend.text}
              </span>
            )}

            {uniqueTopics.length > 0 && (
              <select
                value={selectedTopicFilter}
                onChange={(e) => setSelectedTopicFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Topics ({history.length})</option>
                {uniqueTopics.map((top) => (
                  <option key={top} value={top}>
                    {top}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-xs text-zinc-500">
            Loading chart analytics...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 bg-zinc-950/50 rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <Brain className="w-10 h-10 text-zinc-600" />
            <p className="text-xs text-zinc-400 font-medium">No quiz attempt data to plot yet.</p>
            <p className="text-[11px] text-zinc-500">Complete quizzes to generate your score progression curve.</p>
          </div>
        ) : (
          <div className="w-full h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  unit="%"
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={avgScore} stroke="#6366f1" strokeDasharray="4 4" label={{ value: `Avg ${avgScore}%`, fill: '#818cf8', fontSize: 10, position: 'insideTopRight' }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  activeDot={{ r: 7, fill: '#818cf8', stroke: '#312e81', strokeWidth: 2 }}
                  dot={{ r: 4, fill: '#6366f1', stroke: '#18181b', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Topic Accuracy Breakdown */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-2xl space-y-6">
        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-400" />
          Topic Mastery Breakdown
        </h3>

        {loading ? (
          <p className="text-xs text-zinc-500 py-4">Loading stats...</p>
        ) : topicList.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            Complete your first quiz to generate mastery reports!
          </div>
        ) : (
          <div className="space-y-4">
            {topicList.map((item) => (
              <div key={item.topic} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200">
                    {item.topic} ({item.attempts} {item.attempts === 1 ? 'attempt' : 'attempts'})
                  </span>
                  <span className="font-mono font-bold text-indigo-400">{item.avgPct}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.avgPct >= 80 ? 'bg-emerald-500' : item.avgPct >= 50 ? 'bg-indigo-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${item.avgPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements Modal Component */}
      <AchievementsModal
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
        history={history}
      />
    </div>
  );
};


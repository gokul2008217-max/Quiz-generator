import React, { useEffect, useState } from 'react';
import { BarChart3, Trophy, Clock, Target, Award, Sparkles, Brain } from 'lucide-react';
import api from '../api/client';
import { QuizHistoryItem } from '../types';

export const Analytics: React.FC = () => {
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  const topicList = Object.entries(topicStats).map(([topic, data]) => ({
    topic,
    attempts: data.attempts,
    avgPct: Math.round(data.totalPct / data.attempts),
  })).sort((a, b) => b.avgPct - a.avgPct);

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Performance & Analytics
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Real-time statistics recorded from your SQLite database</p>
        </div>
        <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300 font-semibold">
          Pro Stats
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
                  <span className="font-semibold text-zinc-200">{item.topic} ({item.attempts} attempts)</span>
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
    </div>
  );
};

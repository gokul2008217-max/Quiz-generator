import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Search, ArrowRight, Clock, BrainCircuit, SlidersHorizontal, ArrowUpDown, Filter } from 'lucide-react';
import api from '../api/client';
import { QuizHistoryItem } from '../types';

type SortOption = 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc' | 'topic-asc' | 'topic-desc';

export const QuizHistory: React.FC = () => {
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get<QuizHistoryItem[]>('/quiz/history');
      setHistory(res.data);
    } catch (err: any) {
      setError('Failed to load quiz history.');
    } finally {
      setLoading(false);
    }
  };

  const processedHistory = useMemo(() => {
    return history
      .filter((item) => {
        const matchesSearch =
          item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.difficulty.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDifficulty =
          difficultyFilter === 'all' || item.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
        return matchesSearch && matchesDifficulty;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date-desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'date-asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'score-desc':
            return b.percentage - a.percentage;
          case 'score-asc':
            return a.percentage - b.percentage;
          case 'topic-asc':
            return a.topic.localeCompare(b.topic);
          case 'topic-desc':
            return b.topic.localeCompare(a.topic);
          default:
            return 0;
        }
      });
  }, [history, searchTerm, difficultyFilter, sortBy]);

  const formatTime = (seconds: number) => {
    if (!seconds) return 'Untimed';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Header Search & Title */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              Quiz Attempt History
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Search, filter, and sort your saved quiz attempts
            </p>
          </div>

          <div className="text-xs text-zinc-400 font-medium bg-zinc-950 px-3.5 py-1.5 rounded-xl border border-zinc-800">
            Showing <span className="text-indigo-400 font-bold">{processedHistory.length}</span> of {history.length} attempts
          </div>
        </div>

        {/* Search, Filter & Sort Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-zinc-800/80">
          {/* Search Input */}
          <div className="relative sm:col-span-5">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search topic or difficulty..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Difficulty Filter Dropdown */}
          <div className="relative sm:col-span-3">
            <Filter className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative sm:col-span-4">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
            >
              <option value="date-desc">Sort: Date (Newest First)</option>
              <option value="date-asc">Sort: Date (Oldest First)</option>
              <option value="score-desc">Sort: Score (Highest First)</option>
              <option value="score-asc">Sort: Score (Lowest First)</option>
              <option value="topic-asc">Sort: Topic (A - Z)</option>
              <option value="topic-desc">Sort: Topic (Z - A)</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-500 text-xs">
          <span className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></span>
          <p>Loading history records...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          {error}
        </div>
      ) : processedHistory.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center space-y-4">
          <BrainCircuit className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-300">No Matching Attempts</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchTerm || difficultyFilter !== 'all'
              ? 'No quizzes match your current search and filter criteria.'
              : 'You haven’t completed any quizzes yet. Generate a new quiz to get started!'}
          </p>
          {(searchTerm || difficultyFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDifficultyFilter('all');
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Clear Filters
            </button>
          )}
          {!history.length && (
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
            >
              Create New Quiz
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {processedHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/quiz/results/${item.id}`)}
              className="bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 p-5 rounded-2xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-sm ${
                    item.percentage >= 80
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : item.percentage >= 50
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {item.percentage}%
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors">
                      {item.topic}
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                      {item.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
                    <span>{formatDate(item.createdAt)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {formatTime(item.timeTakenSeconds)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-zinc-800/80 pt-3 sm:pt-0">
                <div className="text-left sm:text-right">
                  <p className="text-xs font-bold text-zinc-200">
                    {item.score} / {item.totalQuestions}
                  </p>
                  <p className="text-[10px] text-zinc-500">Correct Answers</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-950 group-hover:bg-indigo-600 text-zinc-400 group-hover:text-white flex items-center justify-center transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Brain, Sliders, History as HistoryIcon, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import api from '../api/client';
import { QuizRequest, QuizHistoryItem } from '../types';

export const QuizGenerator: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionType, setQuestionType] = useState<'mcq' | 'true_false' | 'mixed'>('mcq');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [enableTimer, setEnableTimer] = useState<boolean>(true);
  const [timerSecondsPerQ, setTimerSecondsPerQ] = useState<number>(45);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [recentHistory, setRecentHistory] = useState<QuizHistoryItem[]>([]);

  const navigate = useNavigate();

  const sampleTopics = [
    'Quantum Physics',
    'Modern Architecture',
    'React 19 & Web Dev',
    'World History',
    'Astronomy & Cosmos',
    'Machine Learning'
  ];

  useEffect(() => {
    fetchRecentHistory();
  }, []);

  const fetchRecentHistory = async () => {
    try {
      const res = await api.get<QuizHistoryItem[]>('/quiz/history');
      setRecentHistory(res.data.slice(0, 3));
    } catch (err) {
      console.error('Failed to load recent history preview:', err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a quiz topic.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload: QuizRequest = {
        topic: topic.trim(),
        difficulty,
        questionType,
        numQuestions,
        timeLimitSeconds: enableTimer ? timerSecondsPerQ * numQuestions : undefined,
      };

      const res = await api.post('/quiz/generate', payload);
      
      // Store generated quiz in session state for instant quiz taking
      sessionStorage.setItem('active_quiz', JSON.stringify({
        ...res.data,
        timeLimitSeconds: enableTimer ? timerSecondsPerQ * numQuestions : 0,
      }));

      navigate('/quiz/active');
    } catch (err: any) {
      console.error('Quiz Generation error:', err);
      setError(
        err.response?.data?.error || err.message || 'Failed to generate quiz with Gemini AI. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto w-full">
      {/* Main Generator Column */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <form onSubmit={handleGenerate} className="bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-7">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-5">
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Configure AI Quiz
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Customize topic, difficulty, and question params</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              Gemini 3.6 Flash
            </span>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs leading-relaxed">
              {error}
            </div>
          )}

          {/* Topic Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              What's the topic?
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Modern Architecture, Quantum Physics, Greek Mythology..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-indigo-500 transition-colors text-base text-zinc-100 placeholder-zinc-600 shadow-inner"
            />
            {/* Quick Topic Chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-[11px] text-zinc-500 font-medium py-1">Quick ideas:</span>
              {sampleTopics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className="text-xs bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded-lg border border-zinc-800 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty & Question Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Difficulty Level
              </label>
              <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`flex-1 py-2 text-xs font-semibold capitalize rounded-lg transition-all ${
                      difficulty === lvl
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 border border-indigo-500'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="mcq">Multiple Choice (4 Options)</option>
                <option value="true_false">True / False Concepts</option>
                <option value="mixed">Mixed Styles</option>
              </select>
            </div>
          </div>

          {/* Number of Questions Slider */}
          <div className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Number of Questions
              </label>
              <span className="text-indigo-400 font-bold font-mono text-sm bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                {numQuestions} questions
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={15}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>3 Quick Qs</span>
              <span>10 Standard</span>
              <span>15 Deep Dive</span>
            </div>
          </div>

          {/* Timer Settings */}
          <div className="flex items-center justify-between p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">Timed Mode</p>
                <p className="text-[11px] text-zinc-500">
                  {enableTimer ? `${timerSecondsPerQ * numQuestions}s total (${timerSecondsPerQ}s per question)` : 'No time limit'}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={enableTimer}
              onChange={(e) => setEnableTimer(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-800 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-600/20 disabled:opacity-60 text-base"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Generating Quiz with Gemini...</span>
              </div>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                <span>Generate Quiz with Gemini AI</span>
              </>
            )}
          </button>
        </form>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-zinc-200">Instant Explanations</p>
              <p className="text-[11px] text-zinc-500">Detailed educational rationale for every question answer</p>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-xl flex items-center gap-3">
            <Brain className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-zinc-200">SQLite Saved History</p>
              <p className="text-[11px] text-zinc-500">Track scores, times, and review past completed attempts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Side Column: Learning Insights & Saved History Widget */}
      <div className="lg:col-span-4 space-y-6">
        {/* Learning Insight Banner */}
        <div className="bg-indigo-950/30 border border-indigo-500/20 p-6 rounded-2xl">
          <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Learning Insight
          </h3>
          <p className="text-xs leading-relaxed text-zinc-300">
            Generating quizzes regularly boosts retention by up to <span className="text-indigo-300 font-semibold">40%</span>.
            Try challenging yourself with Medium or Hard difficulty!
          </p>
          <div className="mt-4 flex items-end gap-1.5 h-12">
            <div className="flex-1 bg-indigo-500/30 rounded-t h-[40%]"></div>
            <div className="flex-1 bg-indigo-500/50 rounded-t h-[70%]"></div>
            <div className="flex-1 bg-indigo-500 rounded-t h-[95%]"></div>
            <div className="flex-1 bg-indigo-500/60 rounded-t h-[60%]"></div>
            <div className="flex-1 bg-indigo-500/20 rounded-t h-[35%]"></div>
          </div>
        </div>

        {/* Recent History Mini Panel */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <HistoryIcon className="w-4 h-4 text-zinc-400" />
              Saved History
            </h3>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-medium"
            >
              View all
            </button>
          </div>

          {recentHistory.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              No previous quizzes completed yet.
            </div>
          ) : (
            <div className="space-y-4">
              {recentHistory.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-800/40 transition-colors">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    item.percentage >= 80 ? 'bg-emerald-400' : item.percentage >= 50 ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{item.topic}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Score: {item.score}/{item.totalQuestions} ({item.percentage}%) • {item.difficulty}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

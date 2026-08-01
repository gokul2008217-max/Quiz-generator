import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../api/client';
import { QuizQuestion, UserAnswer, QuizSubmissionResult } from '../types';

export const QuizActive: React.FC = () => {
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState<{
    quizId: number;
    topic: string;
    difficulty: string;
    timeLimitSeconds: number;
    questions: QuizQuestion[];
  } | null>(null);

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('active_quiz');
    if (!raw) {
      navigate('/');
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setQuizData(parsed);
      if (parsed.timeLimitSeconds && parsed.timeLimitSeconds > 0) {
        setTimeLeft(parsed.timeLimitSeconds);
      }
    } catch (e) {
      navigate('/');
    }
  }, [navigate]);

  // Timer countdown hook
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleAutoSubmit = () => {
    submitQuiz();
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const submitQuiz = async () => {
    if (!quizData || submitting) return;
    setSubmitting(true);

    try {
      const answersList: UserAnswer[] = Object.entries(selectedAnswers).map(([qId, optIdx]) => ({
        questionId: Number(qId),
        selectedOptionIndex: Number(optIdx),
      }));

      const timeTaken = quizData.timeLimitSeconds
        ? Math.max(0, quizData.timeLimitSeconds - (timeLeft || 0))
        : 0;

      const res = await api.post<QuizSubmissionResult>('/quiz/submit', {
        quizId: quizData.quizId,
        answers: answersList,
        timeTakenSeconds: timeTaken,
      });

      sessionStorage.removeItem('active_quiz');
      sessionStorage.setItem('last_submission', JSON.stringify(res.data));
      navigate(`/quiz/results/${res.data.attemptId}`);
    } catch (err: any) {
      console.error('Submission failed:', err);
      alert('Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  };

  if (!quizData) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-zinc-400 text-sm">
        Loading quiz session...
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentIdx];
  const totalQuestions = quizData.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 p-4 sm:p-8 flex flex-col items-center justify-center relative">
      {/* Quiz Container */}
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header Bar */}
        <div className="p-6 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
              {quizData.topic} • {quizData.difficulty}
            </span>
            <h2 className="text-base font-semibold text-zinc-100 mt-2">
              Question {currentIdx + 1} of {totalQuestions}
            </h2>
          </div>

          {/* Timer Display */}
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-sm font-bold ${
                timeLeft < 30
                  ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'
                  : 'bg-zinc-800 text-zinc-200 border-zinc-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-950 h-1.5 relative overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question & Options Area */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">
          <h3 className="text-lg sm:text-xl font-medium leading-relaxed text-zinc-100">
            {currentQuestion.question}
          </h3>

          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((optionText, optIdx) => {
              const isSelected = selectedAnswers[currentQuestion.id] === optIdx;
              const optionLetters = ['A', 'B', 'C', 'D'];

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500 text-zinc-100 shadow-md shadow-indigo-600/10'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {optionLetters[optIdx] || optIdx + 1}
                  </span>
                  <span className="text-sm font-medium leading-normal flex-1">{optionText}</span>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-6 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((prev) => prev - 1)}
            className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-zinc-500 font-medium">
            Answered: {answeredCount}/{totalQuestions}
          </span>

          {currentIdx < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIdx((prev) => prev + 1)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              <span>Submit Quiz</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Early Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-zinc-100">Submit Quiz?</h4>
              <p className="text-xs text-zinc-400 mt-1">
                You have answered {answeredCount} out of {totalQuestions} questions. Are you sure you want to finish and calculate your score?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800"
              >
                Continue Quiz
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  submitQuiz();
                }}
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

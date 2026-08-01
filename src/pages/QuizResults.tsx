import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Trophy,
  Clock,
  RotateCcw,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Download,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  BrainCircuit,
  BookOpen,
  X
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import api from '../api/client';
import { QuizSubmissionResult, AnswerResult } from '../types';

export const QuizResults: React.FC = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Flashcard Mode States
  const [isFlashcardMode, setIsFlashcardMode] = useState<boolean>(false);
  const [flashcardFilter, setFlashcardFilter] = useState<'missed' | 'all'>('missed');
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredCardIndices, setMasteredCardIndices] = useState<number[]>([]);

  useEffect(() => {
    // First try loading from session state (from instant submission)
    const raw = sessionStorage.getItem('last_submission');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!attemptId || String(parsed.attemptId) === String(attemptId)) {
          setResult(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Fallback to API
      }
    }

    if (attemptId) {
      fetchAttemptDetails(attemptId);
    } else {
      setError('Quiz result not found.');
      setLoading(false);
    }
  }, [attemptId]);

  const fetchAttemptDetails = async (id: string) => {
    try {
      const res = await api.get(`/quiz/attempt/${id}`);
      setResult(res.data);
    } catch (err: any) {
      setError('Failed to load quiz results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-400 text-sm">
        <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3"></span>
        Calculating results...
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex-1 p-8 text-center max-w-md mx-auto my-auto space-y-4">
        <p className="text-red-400 text-sm">{error || 'Result record missing.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
        >
          Return to Generator
        </button>
      </div>
    );
  }

  const { score, totalQuestions, percentage, timeTakenSeconds, results } = result;

  const missedQuestions = useMemo(() => {
    if (!result) return [];
    return result.results.filter((q) => !q.isCorrect);
  }, [result]);

  const flashcardQuestions = useMemo(() => {
    if (!result) return [];
    if (flashcardFilter === 'missed' && missedQuestions.length > 0) {
      return missedQuestions;
    }
    return result.results;
  }, [result, flashcardFilter, missedQuestions]);

  const currentFlashcard = flashcardQuestions[currentCardIndex] || flashcardQuestions[0];

  const toggleMasteredCard = (idx: number) => {
    setMasteredCardIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    if (flashcardQuestions.length > 0) {
      setCurrentCardIndex((prev) => (prev + 1) % flashcardQuestions.length);
    }
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    if (flashcardQuestions.length > 0) {
      setCurrentCardIndex((prev) => (prev - 1 + flashcardQuestions.length) % flashcardQuestions.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFlashcardMode) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        handleNextCard();
      } else if (e.key === 'ArrowLeft') {
        handlePrevCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlashcardMode, flashcardQuestions.length]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getGradeBadge = (pct: number) => {
    if (pct >= 80) {
      return { text: 'Excellent Master!', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    } else if (pct >= 50) {
      return { text: 'Good Effort!', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    } else {
      return { text: 'Keep Practicing', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    }
  };

  const badge = getGradeBadge(percentage);

  if (isFlashcardMode) {
    return (
      <div className="flex-1 p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-6">
        {/* Flashcard Header & Exit */}
        <div className="flex items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Flashcard Spaced Repetition
              </h2>
              <p className="text-xs text-zinc-400">
                Master missed concepts through active recall and self-assessment
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsFlashcardMode(false)}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Exit Flashcards</span>
          </button>
        </div>

        {/* Filter Toggle & Progress */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
            <button
              onClick={() => {
                setFlashcardFilter('missed');
                setCurrentCardIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                flashcardFilter === 'missed'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Missed Questions ({missedQuestions.length})
            </button>
            <button
              onClick={() => {
                setFlashcardFilter('all');
                setCurrentCardIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                flashcardFilter === 'all'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Questions ({results.length})
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-zinc-400">
            <span>
              Card <strong className="text-purple-400 font-bold">{flashcardQuestions.length > 0 ? currentCardIndex + 1 : 0}</strong> of {flashcardQuestions.length}
            </span>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>{masteredCardIndices.length} Mastered</span>
            </div>
          </div>
        </div>

        {/* Interactive Flashcard Container */}
        {flashcardQuestions.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center space-y-4">
            <Trophy className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-zinc-200">No Missed Questions!</h3>
            <p className="text-xs text-zinc-400">You scored 100% on this quiz. Great job!</p>
            <button
              onClick={() => setFlashcardFilter('all')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl"
            >
              Practice All Questions
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="cursor-pointer group relative min-h-[320px] bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              {/* Top Card Badge */}
              <div className="flex items-center justify-between gap-3 text-xs border-b border-zinc-800 pb-4 mb-4">
                <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2.5 py-1 rounded-lg font-mono">
                  Card #{currentCardIndex + 1}
                </span>

                <div className="flex items-center gap-2">
                  {masteredCardIndices.includes(currentCardIndex) && (
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Mastered
                    </span>
                  )}
                  <span className="text-zinc-500 text-[11px] font-medium flex items-center gap-1 group-hover:text-purple-400 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> {isFlipped ? 'Showing Back (Answer)' : 'Showing Front (Question)'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 flex flex-col justify-center my-2 space-y-4">
                {!isFlipped ? (
                  /* FRONT OF CARD */
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Question</span>
                    <h3 className="text-lg sm:text-xl font-bold text-zinc-100 leading-snug">
                      {currentFlashcard?.question}
                    </h3>
                    <div className="space-y-2 pt-2">
                      {currentFlashcard?.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-xs text-zinc-300"
                        >
                          <span className="font-mono text-zinc-500 font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* BACK OF CARD */
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct Answer & Explanation
                    </span>

                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                      <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Correct Option</p>
                      <p className="text-sm font-extrabold text-emerald-300">
                        {currentFlashcard?.options[currentFlashcard.correctAnswerIndex]}
                      </p>
                    </div>

                    <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" /> Key Learning Takeaway
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {currentFlashcard?.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Flip Instruction */}
              <div className="pt-4 border-t border-zinc-800/80 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                <span>Click card or press <kbd className="px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-300 font-mono">Spacebar</kbd> to flip</span>
              </div>
            </div>

            {/* Navigation & Mastery Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  onClick={handlePrevCard}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-purple-600/20"
                >
                  <Eye className="w-4 h-4" />
                  <span>{isFlipped ? 'Show Question' : 'Flip Card'}</span>
                </button>

                <button
                  onClick={handleNextCard}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => toggleMasteredCard(currentCardIndex)}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                  masteredCardIndices.includes(currentCardIndex)
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{masteredCardIndices.includes(currentCardIndex) ? 'Mastered!' : 'Mark as Mastered'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const downloadPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 15;

    // Header banner
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Quiz Master - Quiz Performance Summary', margin, 16);

    y = 35;

    // Overview box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 38, 3, 3, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Overall Score: ${result.score} / ${result.totalQuestions} (${result.percentage}%)`, margin + 6, y + 10);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Assessment Rating: ${getGradeBadge(result.percentage).text}`, margin + 6, y + 18);
    doc.text(`Time Spent: ${formatTime(result.timeTakenSeconds)}`, margin + 6, y + 25);
    doc.text(`Report Date: ${new Date().toLocaleString()}`, margin + 6, y + 32);

    y += 48;

    // Section Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Detailed Question Analysis & AI Explanations', margin, y);
    y += 8;

    result.results.forEach((q, index) => {
      // Check page break
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Status indicator
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const statusText = q.isCorrect ? '[CORRECT]' : '[INCORRECT]';
      if (q.isCorrect) {
        doc.setTextColor(16, 185, 129);
      } else {
        doc.setTextColor(239, 68, 68);
      }
      doc.text(`Q${index + 1}. ${statusText}`, margin, y);

      // Question text
      doc.setTextColor(15, 23, 42);
      const questionLines = doc.splitTextToSize(q.question, pageWidth - margin * 2 - 38);
      doc.text(questionLines, margin + 38, y);

      y += Math.max(questionLines.length * 5, 6) + 3;

      // Answers
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const userOpt = q.options[q.selectedOptionIndex] || 'None';
      const correctOpt = q.options[q.correctAnswerIndex] || 'None';

      if (q.isCorrect) {
        doc.setTextColor(16, 185, 129);
        const userAnsLines = doc.splitTextToSize(`Your Answer: ${userOpt}`, pageWidth - margin * 2 - 8);
        doc.text(userAnsLines, margin + 5, y);
        y += userAnsLines.length * 4.5 + 1;
      } else {
        doc.setTextColor(239, 68, 68);
        const userAnsLines = doc.splitTextToSize(`Your Answer: ${userOpt}`, pageWidth - margin * 2 - 8);
        doc.text(userAnsLines, margin + 5, y);
        y += userAnsLines.length * 4.5 + 1;

        doc.setTextColor(16, 185, 129);
        const correctAnsLines = doc.splitTextToSize(`Correct Answer: ${correctOpt}`, pageWidth - margin * 2 - 8);
        doc.text(correctAnsLines, margin + 5, y);
        y += correctAnsLines.length * 4.5 + 1;
      }

      // Explanation
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'italic');
      const expLines = doc.splitTextToSize(`Explanation: ${q.explanation}`, pageWidth - margin * 2 - 8);
      doc.text(expLines, margin + 5, y);

      y += expLines.length * 4.5 + 8;

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y - 4, pageWidth - margin, y - 4);
    });

    doc.save(`Quiz-Summary-${result.attemptId || 'report'}.pdf`);
  };

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Score Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <span className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border mb-1 ${badge.color}`}>
                {badge.text}
              </span>
              <h2 className="text-2xl font-bold text-zinc-100">Quiz Completed!</h2>
              <p className="text-xs text-zinc-400 mt-1">Here is your detailed AI score analysis and explanation review.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center shrink-0 w-full sm:w-auto justify-around">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-semibold">Score</p>
              <p className="text-2xl font-extrabold text-indigo-400 font-mono mt-0.5">{percentage}%</p>
              <p className="text-[10px] text-zinc-400">{score} / {totalQuestions} Correct</p>
            </div>
            <div className="w-px h-8 bg-zinc-800"></div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-semibold">Time</p>
              <p className="text-lg font-bold text-zinc-200 font-mono mt-1">{formatTime(timeTakenSeconds)}</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-800">
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Generate Another Quiz</span>
          </button>
          <button
            onClick={() => {
              setFlashcardFilter(missedQuestions.length > 0 ? 'missed' : 'all');
              setCurrentCardIndex(0);
              setIsFlipped(false);
              setIsFlashcardMode(true);
            }}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-purple-600/20"
          >
            <Layers className="w-4 h-4" />
            <span>Flashcard Mode {missedQuestions.length > 0 ? `(${missedQuestions.length} Missed)` : `(${results.length})`}</span>
          </button>
          <button
            onClick={downloadPDF}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={() => navigate('/history')}
            className="px-5 py-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <span>History</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Spaced Repetition Callout Banner */}
      {missedQuestions.length > 0 && (
        <div className="bg-gradient-to-r from-purple-950/40 via-zinc-900 to-indigo-950/40 border border-purple-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0 shadow">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Spaced Repetition Flashcards Ready!
                <span className="text-[10px] bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold px-2 py-0.5 rounded-md">
                  {missedQuestions.length} Missed Question{missedQuestions.length > 1 ? 's' : ''}
                </span>
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Practice your missed questions in interactive Flashcard Mode with active recall & self-assessment.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setFlashcardFilter('missed');
              setCurrentCardIndex(0);
              setIsFlipped(false);
              setIsFlashcardMode(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-lg shadow-purple-600/20"
          >
            <Layers className="w-4 h-4" />
            <span>Practice Flashcards Now</span>
          </button>
        </div>
      )}

      {/* Answer Review Section */}
      <div className="space-y-6">
        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          Detailed Explanations & Answers
        </h3>

        <div className="space-y-4">
          {results.map((item, idx) => (
            <div
              key={idx}
              className={`bg-zinc-900 border rounded-2xl p-6 transition-all space-y-4 ${
                item.isCorrect ? 'border-emerald-500/30' : 'border-red-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-zinc-100 leading-snug">{item.question}</h4>
                </div>
                {item.isCorrect ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full shrink-0">
                    <XCircle className="w-3.5 h-3.5" /> Incorrect
                  </span>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {item.options.map((opt, optIdx) => {
                  const isUserSelected = item.selectedOptionIndex === optIdx;
                  const isCorrectAnswer = item.correctAnswerIndex === optIdx;

                  let optionStyle = 'bg-zinc-950/80 border-zinc-800 text-zinc-400';
                  if (isCorrectAnswer) {
                    optionStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold';
                  } else if (isUserSelected && !item.isCorrect) {
                    optionStyle = 'bg-red-500/15 border-red-500 text-red-300 font-semibold';
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${optionStyle}`}
                    >
                      <span>{opt}</span>
                      {isCorrectAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {isUserSelected && !isCorrectAnswer && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Gemini Explanation */}
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gemini Explanation
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{item.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizRequest {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'mcq' | 'true_false' | 'mixed';
  numQuestions: number;
  timeLimitSeconds?: number;
}

export interface Quiz {
  id: number;
  userId: number;
  topic: string;
  difficulty: string;
  questionType: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface UserAnswer {
  questionId: number;
  selectedOptionIndex: number;
}

export interface QuizSubmission {
  quizId: number;
  answers: UserAnswer[];
  timeTakenSeconds: number;
}

export interface AnswerResult {
  questionId: number;
  question: string;
  options: string[];
  selectedOptionIndex: number;
  correctAnswerIndex: number;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizSubmissionResult {
  attemptId: number;
  quizId: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  results: AnswerResult[];
  createdAt: string;
}

export interface QuizHistoryItem {
  id: number;
  quizId: number;
  topic: string;
  difficulty: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

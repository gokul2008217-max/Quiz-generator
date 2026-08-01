import { Router, Response } from 'express';
import { authenticateToken, registerUser, loginUser, AuthenticatedRequest } from './auth.js';
import { generateQuizQuestions } from './gemini.js';
import { insertAndGetId, getOne, getAll } from './db.js';
import { QuizQuestion, QuizRequest, QuizSubmission, AnswerResult, QuizSubmissionResult, QuizHistoryItem } from '../types.js';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Routes
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const result = await registerUser(username, email, password);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    const result = await loginUser(emailOrUsername, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Login failed' });
  }
});

apiRouter.get('/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user = await getOne('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(401).json({ error: 'User account no longer exists' });
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Quiz Routes
apiRouter.post('/quiz/generate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { topic, difficulty = 'medium', questionType = 'mcq', numQuestions = 5 } = req.body as QuizRequest;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Quiz topic is required' });
    }

    const validNumQuestions = Math.min(Math.max(Number(numQuestions) || 5, 1), 20);

    const questions: QuizQuestion[] = await generateQuizQuestions({
      topic: topic.trim(),
      difficulty,
      questionType,
      numQuestions: validNumQuestions
    });

    const createdAt = new Date().toISOString();

    // Store in SQLite database
    const quizId = await insertAndGetId(
      'INSERT INTO quizzes (user_id, topic, difficulty, question_type, num_questions, quiz_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, topic.trim(), difficulty, questionType, questions.length, JSON.stringify(questions), createdAt]
    );

    // Prepare questions for frontend client (keep answers intact or client-side ready)
    res.status(201).json({
      quizId,
      topic: topic.trim(),
      difficulty,
      questionType,
      numQuestions: questions.length,
      createdAt,
      questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options
      }))
    });
  } catch (err: any) {
    console.error('Quiz Generation API Error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate quiz. Please check Gemini API key.' });
  }
});

apiRouter.post('/quiz/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { quizId, answers, timeTakenSeconds = 0 } = req.body as QuizSubmission;

    if (!quizId) {
      return res.status(400).json({ error: 'quizId is required for submission' });
    }

    // Retrieve quiz from SQLite
    const quizRecord = await getOne<{ id: number; topic: string; difficulty: string; quiz_data: string }>(
      'SELECT * FROM quizzes WHERE id = ? AND user_id = ?',
      [quizId, userId]
    );

    if (!quizRecord) {
      return res.status(404).json({ error: 'Quiz not found or unauthorized' });
    }

    const originalQuestions: QuizQuestion[] = JSON.parse(quizRecord.quiz_data);
    let correctCount = 0;
    const results: AnswerResult[] = [];

    originalQuestions.forEach((question) => {
      const userAnswer = answers?.find(a => a.questionId === question.id);
      const selectedIndex = userAnswer !== undefined ? userAnswer.selectedOptionIndex : -1;
      const isCorrect = selectedIndex === question.correctAnswerIndex;

      if (isCorrect) correctCount++;

      results.push({
        questionId: question.id,
        question: question.question,
        options: question.options,
        selectedOptionIndex: selectedIndex,
        correctAnswerIndex: question.correctAnswerIndex,
        isCorrect,
        explanation: question.explanation
      });
    });

    const totalQuestions = originalQuestions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const createdAt = new Date().toISOString();

    // Store attempt in SQLite `quiz_attempts`
    const attemptId = await insertAndGetId(
      'INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, time_taken_seconds, results_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, quizId, correctCount, totalQuestions, timeTakenSeconds, JSON.stringify(results), createdAt]
    );

    const submissionResult: QuizSubmissionResult = {
      attemptId,
      quizId,
      score: correctCount,
      totalQuestions,
      percentage,
      timeTakenSeconds,
      results,
      createdAt
    };

    res.json(submissionResult);
  } catch (err: any) {
    console.error('Quiz Submission API Error:', err);
    res.status(500).json({ error: err.message || 'Failed to process quiz submission' });
  }
});

apiRouter.get('/quiz/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const attempts = await getAll<{
      id: number;
      quiz_id: number;
      score: number;
      total_questions: number;
      time_taken_seconds: number;
      created_at: string;
      topic: string;
      difficulty: string;
    }>(
      `SELECT a.id, a.quiz_id, a.score, a.total_questions, a.time_taken_seconds, a.created_at, q.topic, q.difficulty 
       FROM quiz_attempts a
       JOIN quizzes q ON a.quiz_id = q.id
       WHERE a.user_id = ?
       ORDER BY a.id DESC`,
      [userId]
    );

    const history: QuizHistoryItem[] = attempts.map(item => ({
      id: item.id,
      quizId: item.quiz_id,
      topic: item.topic,
      difficulty: item.difficulty,
      score: item.score,
      totalQuestions: item.total_questions,
      percentage: Math.round((item.score / item.total_questions) * 100),
      timeTakenSeconds: item.time_taken_seconds,
      createdAt: item.created_at
    }));

    res.json(history);
  } catch (err: any) {
    console.error('Quiz History API Error:', err);
    res.status(500).json({ error: 'Failed to fetch quiz history' });
  }
});

apiRouter.get('/quiz/attempt/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const attemptId = req.params.id;

    const attempt = await getOne<{
      id: number;
      quiz_id: number;
      score: number;
      total_questions: number;
      time_taken_seconds: number;
      results_data: string;
      created_at: string;
      topic: string;
      difficulty: string;
    }>(
      `SELECT a.*, q.topic, q.difficulty 
       FROM quiz_attempts a 
       JOIN quizzes q ON a.quiz_id = q.id 
       WHERE a.id = ? AND a.user_id = ?`,
      [attemptId, userId]
    );

    if (!attempt) {
      return res.status(404).json({ error: 'Quiz attempt record not found' });
    }

    const results: AnswerResult[] = JSON.parse(attempt.results_data);

    res.json({
      id: attempt.id,
      quizId: attempt.quiz_id,
      topic: attempt.topic,
      difficulty: attempt.difficulty,
      score: attempt.score,
      totalQuestions: attempt.total_questions,
      percentage: Math.round((attempt.score / attempt.total_questions) * 100),
      timeTakenSeconds: attempt.time_taken_seconds,
      createdAt: attempt.created_at,
      results
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch attempt details' });
  }
});

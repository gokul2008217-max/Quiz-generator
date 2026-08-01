import { GoogleGenAI, Type } from '@google/genai';
import { QuizQuestion, QuizRequest } from '../types.js';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured. Please add your GEMINI_API_KEY in Settings > Secrets.');
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export async function generateQuizQuestions(request: QuizRequest): Promise<QuizQuestion[]> {
  const ai = getAiClient();
  const { topic, difficulty, questionType, numQuestions } = request;

  const prompt = `Generate a high-quality quiz about "${topic}".
Difficulty level: ${difficulty}.
Question style: ${questionType}.
Number of questions required: ${numQuestions}.

For each question:
1. Provide a clear, engaging question text.
2. Provide exactly 4 distinct options (choices).
3. Specify the 0-based index of the correct answer (0, 1, 2, or 3).
4. Provide a thorough, informative, educational explanation explaining why the correct option is right.

Ensure all questions are factual, relevant to "${topic}", and strictly formatted in valid JSON according to the schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      systemInstruction: 'You are an expert AI Quiz Master and Educator. Create accurate, challenging, and engaging quiz questions with detailed explanations.',
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        description: 'List of generated quiz questions',
        items: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: 'The question text',
            },
            options: {
              type: Type.ARRAY,
              description: 'List of exactly 4 options',
              items: {
                type: Type.STRING,
              },
            },
            correctAnswerIndex: {
              type: Type.INTEGER,
              description: '0-based index of the correct option (0, 1, 2, or 3)',
            },
            explanation: {
              type: Type.STRING,
              description: 'Detailed explanation for the correct answer',
            },
          },
          required: ['question', 'options', 'correctAnswerIndex', 'explanation'],
        },
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error('Failed to generate quiz questions from Gemini API: Empty response.');
  }

  try {
    const parsed = JSON.parse(responseText.trim());
    
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Invalid response structure from AI model');
    }

    // Map into standard QuizQuestion array with numeric IDs
    const questions: QuizQuestion[] = parsed.map((item: any, idx: number) => {
      // Clean and ensure 4 options
      let options: string[] = Array.isArray(item.options) ? item.options : [];
      while (options.length < 4) {
        options.push(`Option ${options.length + 1}`);
      }
      if (options.length > 4) {
        options = options.slice(0, 4);
      }

      let correctIndex = typeof item.correctAnswerIndex === 'number' ? item.correctAnswerIndex : 0;
      if (correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0;
      }

      return {
        id: idx + 1,
        question: item.question || `Question ${idx + 1}`,
        options,
        correctAnswerIndex: correctIndex,
        explanation: item.explanation || 'No explanation provided.',
      };
    });

    return questions;
  } catch (err: any) {
    console.error('Failed to parse Gemini Quiz JSON output:', err, responseText);
    throw new Error(`Failed to parse AI-generated quiz: ${err?.message || 'Invalid JSON output'}`);
  }
}

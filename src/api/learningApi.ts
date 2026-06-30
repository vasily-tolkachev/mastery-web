import { API_BASE_URL } from '../config/env';
import type { LearningState } from '../types/learning';

export interface StartRequest {
  userId: string;
}

export interface AnswerRequest {
  userId: string;
  answer: string;
}

export interface PracticeRequest {
  userId: string;
  booleanAnswer: boolean | null;
  selectedOptions: number[];
}

export async function getLearningState(userId: string): Promise<LearningState> {
  const response = await fetch(
    `${API_BASE_URL}/api/learning/state?userId=${encodeURIComponent(userId)}`,
  );
  if (!response.ok) {
    throw new Error(`Не удалось получить состояние (${response.status})`);
  }
  return response.json();
}

export async function startLearning(
  payload: StartRequest,
): Promise<LearningState> {
  return postJson('/api/learning/start', payload);
}

export async function submitAnswer(
  payload: AnswerRequest,
): Promise<LearningState> {
  return postJson('/api/learning/answer', payload);
}

export async function continueLearning(
  payload: StartRequest,
): Promise<LearningState> {
  return postJson('/api/learning/continue', payload);
}

export async function submitPractice(
  payload: PracticeRequest,
): Promise<LearningState> {
  return postJson('/api/learning/practice', payload);
}

export async function submitQuickCheck(
  payload: AnswerRequest,
): Promise<LearningState> {
  return postJson('/api/learning/quick-check', payload);
}

export async function submitRetry(
  payload: AnswerRequest,
): Promise<LearningState> {
  return postJson('/api/learning/retry', payload);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Ошибка запроса ${path} (${response.status})`);
  }
  return response.json();
}

import { API_BASE_URL } from '../config/env';
import { authFetch } from './http';
import type { LearningState } from '../types/learning';

export interface StartRequest {}

export interface AnswerRequest {
  answer: string;
}

export interface PracticeRequest {
  booleanAnswer: boolean | null;
  selectedOptions: number[];
}

export async function getLearningState(): Promise<LearningState> {
  const response = await authFetch(`${API_BASE_URL}/api/learning/state`);
  if (!response.ok) {
    throw new Error(`Failed to fetch learning state (${response.status})`);
  }
  const data = await response.json();
  return normalizeLearningState(data);
}

export async function startLearning(
  payload: StartRequest,
): Promise<LearningState> {
  return postLearningState('/api/learning/start', payload);
}

export async function submitAnswer(
  payload: AnswerRequest,
): Promise<LearningState> {
  return postLearningState('/api/learning/answer', payload);
}

export async function continueLearning(
  payload: StartRequest,
): Promise<LearningState> {
  return postLearningState('/api/learning/continue', payload);
}

export async function submitPractice(
  payload: PracticeRequest,
): Promise<LearningState> {
  return postLearningState('/api/learning/practice', payload);
}

export async function submitQuickCheck(
  payload: AnswerRequest,
): Promise<LearningState> {
  return postLearningState('/api/learning/quick-check', payload);
}

export async function submitRetry(
  payload: AnswerRequest,
): Promise<LearningState> {
  return postLearningState('/api/learning/retry', payload);
}

async function postLearningState(path: string, body: unknown): Promise<LearningState> {
  const response = await authFetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Request failed for ${path} (${response.status})`);
  }
  const data = await response.json();
  return normalizeLearningState(data);
}

function normalizeLearningState(value: unknown): LearningState {
  const raw = (value ?? {}) as Record<string, unknown>;
  const phase = ((raw.phase as string | undefined) ?? 'COMPLETED') as LearningState['phase'];
  const currentActivityRaw = (raw.currentActivity ?? {}) as Record<string, unknown>;

  const context = (raw.context ?? {}) as Record<string, unknown>;
  const progress = (raw.progress ?? {}) as Record<string, unknown>;

  return {
    schemaVersion: Number(raw.schemaVersion ?? 1),
    sessionId: (raw.sessionId as string | null | undefined) ?? null,
    userId: String(raw.userId ?? ''),
    phase,
    context: {
      topicId: toNullableNumber(context.topicId),
      topicName: toNullableString(context.topicName),
      conceptId: toNullableNumber(context.conceptId),
      conceptName: toNullableString(context.conceptName),
      microConceptId: toNullableNumber(context.microConceptId),
      microConceptName: toNullableString(context.microConceptName),
    },
    progress: {
      conceptOrder: toNullableNumber(progress.conceptOrder),
      totalConcepts: toNullableNumber(progress.totalConcepts),
      microConceptOrder: toNullableNumber(progress.microConceptOrder),
      totalMicroConcepts: toNullableNumber(progress.totalMicroConcepts),
      answeredCount: toNumber(progress.answeredCount, 0),
    },
    currentActivity: ({
      ...currentActivityRaw,
      type: ((currentActivityRaw.type as string | undefined) ?? phase) as LearningState['currentActivity']['type'],
      items: Array.isArray(currentActivityRaw.items) ? currentActivityRaw.items : [],
      rubric: Array.isArray(currentActivityRaw.rubric) ? currentActivityRaw.rubric : [],
    } as unknown) as LearningState['currentActivity'],
    availableActions: Array.isArray(raw.availableActions)
      ? (raw.availableActions as LearningState['availableActions'])
      : [],
  };
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

import { API_BASE_URL } from '../config/env';
import type { LearningProgram, ProgramConcept, ProgramMicroConcept } from '../types/program';

export async function getCurrentProgram(userId: string): Promise<LearningProgram> {
  const response = await fetch(
    `${API_BASE_URL}/api/programs/current?userId=${encodeURIComponent(userId)}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch current program (${response.status})`);
  }

  const data = await response.json();
  return normalizeLearningProgram(data);
}

function normalizeLearningProgram(value: unknown): LearningProgram {
  const raw = (value ?? {}) as Record<string, unknown>;
  const progressRaw = (raw.progress ?? {}) as Record<string, unknown>;
  const conceptsRaw = Array.isArray(raw.concepts) ? raw.concepts : [];

  return {
    programId: String(raw.programId ?? ''),
    title: String(raw.title ?? ''),
    goalTitle: String(raw.goalTitle ?? ''),
    concepts: conceptsRaw.map(normalizeConcept),
    progress: {
      totalConcepts: toNumber(progressRaw.totalConcepts, 0),
      totalMicroConcepts: toNumber(progressRaw.totalMicroConcepts, 0),
    },
  };
}

function normalizeConcept(value: unknown): ProgramConcept {
  const raw = (value ?? {}) as Record<string, unknown>;
  const microConceptsRaw = Array.isArray(raw.microConcepts) ? raw.microConcepts : [];

  return {
    conceptId: toNullableNumber(raw.conceptId),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    estimatedTimeMinutes: toNumber(raw.estimatedTimeMinutes, 0),
    difficulty: String(raw.difficulty ?? ''),
    prerequisites: Array.isArray(raw.prerequisites) ? raw.prerequisites.map((item) => String(item)) : [],
    microConcepts: microConceptsRaw.map(normalizeMicroConcept),
  };
}

function normalizeMicroConcept(value: unknown): ProgramMicroConcept {
  const raw = (value ?? {}) as Record<string, unknown>;
  return {
    microConceptId: toNullableNumber(raw.microConceptId),
    title: String(raw.title ?? ''),
    sortOrder: toNullableNumber(raw.sortOrder),
    completed: Boolean(raw.completed),
    current: Boolean(raw.current),
    locked: Boolean(raw.locked),
  };
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

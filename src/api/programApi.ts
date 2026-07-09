import { authFetch } from './http';
import type {
  LearningProgram,
  ProgramConcept,
  ProgramGenerationStatus,
  ProgramMicroConcept,
  ProgramRecord,
} from '../types/program';

export async function getCurrentProgram(): Promise<LearningProgram> {
  const response = await authFetch('/api/programs/current');
  if (!response.ok) {
    throw new Error(`Failed to fetch current program (${response.status})`);
  }

  const data = await response.json();
  return normalizeLearningProgram(data);
}

export async function getProgramById(programId: number): Promise<ProgramRecord | null> {
  const response = await authFetch(`/api/programs/${programId}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch program (${response.status})`);
  }
  return normalizeProgramRecord(await response.json());
}

export async function getProgramTree(programId: number): Promise<LearningProgram | null> {
  const response = await authFetch(`/api/programs/${programId}/tree`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch program tree (${response.status})`);
  }
  return normalizeLearningProgram(await response.json());
}

export async function getProgramStatus(programId: number): Promise<ProgramGenerationStatus | null> {
  const response = await authFetch(`/api/programs/${programId}/status`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch program status (${response.status})`);
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return {
    programId: toNumber(raw.programId, 0),
    status: String(raw.status ?? 'CREATED') as ProgramGenerationStatus['status'],
    updatedAt: String(raw.updatedAt ?? ''),
  };
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

function normalizeProgramRecord(value: unknown): ProgramRecord {
  const raw = (value ?? {}) as Record<string, unknown>;
  return {
    id: toNumber(raw.id, 0),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    status: String(raw.status ?? 'CREATED') as ProgramRecord['status'],
    origin: String(raw.origin ?? 'GOAL_BASED') as ProgramRecord['origin'],
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
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

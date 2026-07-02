import { API_BASE_URL } from '../config/env';
import type { CreateGoalRequest, Goal, GoalResolutionStatus, GoalStartResult } from '../types/goal';
import type { LearningProgram } from '../types/program';

export async function createGoal(payload: CreateGoalRequest): Promise<Goal> {
  const response = await fetch(`${API_BASE_URL}/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Failed to create goal (${response.status})`);
  }
  return normalizeGoal(await response.json());
}

export async function getGoals(): Promise<Goal[]> {
  const response = await fetch(`${API_BASE_URL}/goals`);
  if (!response.ok) {
    throw new Error(`Failed to load goals (${response.status})`);
  }
  const raw = await response.json();
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeGoal);
}

export async function getGoalResolutionStatus(goalId: number): Promise<GoalResolutionStatus | null> {
  const response = await fetch(`${API_BASE_URL}/goals/${goalId}/resolution-status`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to load goal resolution status (${response.status})`);
  }
  return normalizeGoalResolutionStatus(await response.json());
}

export async function startGoal(goalId: number, userId: string): Promise<GoalStartResult> {
  const response = await fetch(`${API_BASE_URL}/goals/${goalId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to start goal (${response.status})`);
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return {
    goalId: Number(raw.goalId ?? 0),
    programId: String(raw.programId ?? ''),
    status: String(raw.status ?? ''),
  };
}

export async function getGoalProgram(goalId: number): Promise<LearningProgram | null> {
  const response = await fetch(`${API_BASE_URL}/goals/${goalId}/program`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to load goal program (${response.status})`);
  }
  const raw = (await response.json()) as Record<string, unknown>;
  const progressRaw = (raw.progress ?? {}) as Record<string, unknown>;
  return {
    programId: String(raw.programId ?? ''),
    goalId: raw.goalId === null || raw.goalId === undefined ? null : Number(raw.goalId),
    origin: String(raw.origin ?? 'GOAL_BASED'),
    title: String(raw.title ?? ''),
    goalTitle: String(raw.goalTitle ?? ''),
    concepts: [],
    progress: {
      totalConcepts: Number(progressRaw.totalConcepts ?? 0),
      totalMicroConcepts: Number(progressRaw.totalMicroConcepts ?? 0),
    },
  };
}

function normalizeGoal(value: unknown): Goal {
  const raw = (value ?? {}) as Record<string, unknown>;
  return {
    id: Number(raw.id ?? 0),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    status: (raw.status as Goal['status']) ?? 'ACTIVE',
    createdAt: String(raw.createdAt ?? ''),
  };
}

function normalizeGoalResolutionStatus(value: unknown): GoalResolutionStatus {
  const raw = (value ?? {}) as Record<string, unknown>;
  return {
    goalId: Number(raw.goalId ?? 0),
    stage: (raw.stage as GoalResolutionStatus['stage']) ?? 'QUEUED',
    progressPercent: Number(raw.progressPercent ?? 0),
    message: String(raw.message ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

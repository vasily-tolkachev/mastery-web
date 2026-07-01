import { API_BASE_URL } from '../config/env';
import type { CreateGoalRequest, Goal, GoalResolutionStatus } from '../types/goal';

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

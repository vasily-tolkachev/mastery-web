import { API_BASE_URL } from '../config/env';
import type { CreateGoalRequest, Goal } from '../types/goal';

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

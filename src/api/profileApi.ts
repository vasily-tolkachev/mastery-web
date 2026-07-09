import { authFetch } from './http';
import type { UpdateUserProfileRequest, UserProfile } from '../types/profile';

export async function getProfile(): Promise<UserProfile> {
  const response = await authFetch('/api/profile');
  if (!response.ok) {
    throw new Error(`Failed to load profile (${response.status})`);
  }
  return normalizeProfile(await response.json());
}

export async function updateProfile(payload: UpdateUserProfileRequest): Promise<UserProfile> {
  const response = await authFetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Failed to update profile (${response.status})`);
  }
  return normalizeProfile(await response.json());
}

function normalizeProfile(value: unknown): UserProfile {
  const raw = (value ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ''),
    displayName: String(raw.displayName ?? ''),
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

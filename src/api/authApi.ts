import { getAccessToken } from '../auth/tokenStorage';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface AuthUserProfile {
  id: string;
  displayName: string;
  email: string | null;
  createdAt: string;
}

export async function loginWithGoogleIdToken(idToken: string): Promise<TokenResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'GOOGLE',
      providerToken: idToken,
    }),
  });
  if (!response.ok) {
    throw new Error(`Google login failed (${response.status})`);
  }
  return response.json() as Promise<TokenResponse>;
}

export async function getAuthProfile(): Promise<AuthUserProfile> {
  const response = await authApiFetch('/api/profile');
  if (!response.ok) {
    throw new Error(`Failed to load auth profile (${response.status})`);
  }
  return response.json() as Promise<AuthUserProfile>;
}

export async function updateAuthProfile(displayName: string): Promise<AuthUserProfile> {
  const response = await authApiFetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update auth profile (${response.status})`);
  }
  return response.json() as Promise<AuthUserProfile>;
}

function authApiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers ?? {});
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return fetch(input, {
    ...init,
    headers,
  });
}

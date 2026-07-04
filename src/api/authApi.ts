import { AUTH_API_BASE_URL } from '../config/env';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export async function loginWithGoogleIdToken(idToken: string): Promise<TokenResponse> {
  const response = await fetch(`${AUTH_API_BASE_URL}/api/auth/login`, {
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

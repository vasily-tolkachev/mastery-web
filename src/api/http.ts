import { refreshAccessToken } from './authApi';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../auth/tokenStorage';

let refreshInFlight: Promise<string | null> | null = null;

function isAuthEndpoint(input: string): boolean {
  return input.startsWith('/api/auth/');
}

async function ensureFreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }
    try {
      const tokens = await refreshAccessToken(refreshToken);
      setTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      return tokens.accessToken;
    } catch {
      clearTokens();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function withAuthHeaders(init: RequestInit | undefined, accessToken: string | null): RequestInit {
  const headers = new Headers(init?.headers ?? {});
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return {
    ...init,
    headers,
  };
}

export async function authFetch(input: string, init?: RequestInit): Promise<Response> {
  const firstResponse = await fetch(input, withAuthHeaders(init, getAccessToken()));

  if (firstResponse.status !== 401 || isAuthEndpoint(input)) {
    return firstResponse;
  }

  const freshAccessToken = await ensureFreshAccessToken();
  if (!freshAccessToken) {
    if (window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
    return firstResponse;
  }

  return fetch(input, withAuthHeaders(init, freshAccessToken));
}

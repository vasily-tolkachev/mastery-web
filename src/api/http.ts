import { getAccessToken } from '../auth/tokenStorage';

export async function authFetch(input: string, init?: RequestInit): Promise<Response> {
  const accessToken = getAccessToken();
  const headers = new Headers(init?.headers ?? {});
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return fetch(input, {
    ...init,
    headers,
  });
}

'use client';

import { createApiClient } from './api-client';
import { webTokenStorage } from './web-token-storage';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:3000';

export const authClient = createApiClient({
  baseUrl: API_ORIGIN,
  storage: webTokenStorage,
  onAuthExpired: () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
});

export async function getAccessToken(): Promise<string | null> {
  const tokens = await webTokenStorage.getTokens();
  return tokens?.accessToken ?? null;
}
// (ApiError is already exported above via `export class ApiError` — no change needed)
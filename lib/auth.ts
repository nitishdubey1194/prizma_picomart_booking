'use client';

import { apiClient } from './api';
import { webTokenStorage } from './web-token-storage';

export const authClient = apiClient;

export async function getAccessToken(): Promise<string | null> {
  const tokens = await webTokenStorage.getTokens();
  return tokens?.accessToken ?? null;
}

export async function setAuthTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
  await webTokenStorage.setTokens(tokens);
}

export async function clearAuthTokens(): Promise<void> {
  await webTokenStorage.clearTokens();
}

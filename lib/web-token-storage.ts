import type { TokenPair, TokenStorage } from './api-client';

const STORAGE_KEY = 'picomart_tokens';

export const webTokenStorage: TokenStorage = {
  async getTokens() {
    if (typeof window === 'undefined') return null; // server-side: no tokens, public reads proceed unauthenticated
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TokenPair) : null;
  },
  async setTokens(tokens) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  },
  async clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },
};
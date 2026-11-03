import * as SecureStore from 'expo-secure-store';
import type { TokenResponse } from 'expo-auth-session';
import { SESSION_STORAGE_KEY } from './config';

export type Session = {
  accessToken: string;
  refreshToken?: string;
  issuedAt?: number;
  expiresIn?: number;
};

export async function saveSession(tokens: TokenResponse, key: string = SESSION_STORAGE_KEY): Promise<void> {
  const session: Session = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? undefined,
    issuedAt: tokens.issuedAt,
    expiresIn: tokens.expiresIn,
  };
  await SecureStore.setItemAsync(key, JSON.stringify(session));
}

export async function loadSession(key: string = SESSION_STORAGE_KEY): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function clearSession(key: string = SESSION_STORAGE_KEY): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

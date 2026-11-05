import * as SecureStore from 'expo-secure-store';
import { clearSession, loadSession, saveSession } from '../auth';

jest.mock('expo-secure-store', () => ({
  __esModule: true,
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (SecureStore.setItemAsync as jest.Mock).mockImplementation(
    async (key: string, value: string) => void store.set(key, value)
  );
  (SecureStore.getItemAsync as jest.Mock).mockImplementation(
    async (key: string) => store.get(key) ?? null
  );
  (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(
    async (key: string) => void store.delete(key)
  );
});

describe('session storage', () => {
  it('round-trips a saved session', async () => {
    const session = { accessToken: 'token', refreshToken: 'refresh', issuedAt: 1, expiresIn: 3600 };

    await saveSession(session);

    await expect(loadSession()).resolves.toEqual(session);
  });

  it('returns null when nothing is stored', async () => {
    await expect(loadSession()).resolves.toBeNull();
  });

  it('returns null for corrupted stored data', async () => {
    store.set('vocabula.auth', 'not json');

    await expect(loadSession()).resolves.toBeNull();
  });

  it('clears the session', async () => {
    await saveSession({ accessToken: 'token' });

    await clearSession();

    await expect(loadSession()).resolves.toBeNull();
  });
});

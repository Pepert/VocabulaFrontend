import * as SecureStore from 'expo-secure-store';
import { fetch as expoFetch } from 'expo/fetch';
import {
  clearSession,
  loadSession,
  saveSession,
} from '../auth';
import { apiFetch, ApiError, getChapters } from '../api';

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

jest.mock('expo/fetch', () => ({
  __esModule: true,
  fetch: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  __esModule: true,
  File: jest.fn((uri: string) => ({ uri })),
}));

// refreshAccessToken uses the global fetch (Cognito token endpoint).
const globalFetch = jest.fn();

function okResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = globalFetch as unknown as typeof fetch;
});

describe('apiFetch', () => {
  it('attaches the access token to requests', async () => {
    await saveSession({ accessToken: 'my-token' });
    (expoFetch as jest.Mock).mockResolvedValue(okResponse({ chapters: [] }));

    const response = await apiFetch('/api/stories/chapters');

    expect(response.status).toBe(200);
    const [, init] = (expoFetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer my-token');
  });

  it('throws when there is no session', async () => {
    await expect(apiFetch('/api/stories/chapters')).rejects.toThrow(ApiError);
  });

  it('refreshes the token once and retries when the API answers 401', async () => {
    await saveSession({ accessToken: 'expired-token', refreshToken: 'refresh-token' });
    globalFetch.mockResolvedValue(
      okResponse({ access_token: 'fresh-token', refresh_token: 'rotated-refresh', expires_in: 3600 })
    );
    (expoFetch as jest.Mock)
      .mockResolvedValueOnce(okResponse({}, 401))
      .mockResolvedValueOnce(okResponse({ chapters: [] }));

    const response = await apiFetch('/api/stories/chapters');

    expect(response.status).toBe(200);
    // One failed call with the old token + one retried call with the fresh one.
    expect((expoFetch as jest.Mock)).toHaveBeenCalledTimes(2);
    expect((expoFetch as jest.Mock).mock.calls[1][1].headers.Authorization).toBe('Bearer fresh-token');
    // The rotated refresh token is kept.
    const session = await loadSession();
    expect(session?.accessToken).toBe('fresh-token');
    expect(session?.refreshToken).toBe('rotated-refresh');
  });

  it('clears the session when refresh fails', async () => {
    await saveSession({ accessToken: 'expired-token', refreshToken: 'bad-refresh' });
    globalFetch.mockResolvedValue(okResponse({ error: 'invalid_grant' }, 400));
    (expoFetch as jest.Mock).mockResolvedValue(okResponse({}, 401));

    const response = await apiFetch('/api/stories/chapters');

    expect(response.status).toBe(401);
    await expect(loadSession()).resolves.toBeNull();
    await expect(clearSession()).resolves.toBeUndefined();
  });
});

describe('getChapters', () => {
  it('returns the parsed chapters', async () => {
    await saveSession({ accessToken: 'token' });
    (expoFetch as jest.Mock).mockResolvedValue(
      okResponse({
        chapters: [
          {
            chapterNumber: 1,
            storyTitle: 'En morgon',
            content: 'Hej!',
            createdAt: '2026-11-04T09:00:00Z',
          },
        ],
      })
    );

    const result = await getChapters();

    expect(result.chapters).toHaveLength(1);
    expect(result.chapters[0].chapterNumber).toBe(1);
    expect(result.chapters[0].content).toBe('Hej!');
  });

  it('throws ApiError with details when the request fails', async () => {
    await saveSession({ accessToken: 'token' });
    (expoFetch as jest.Mock).mockResolvedValue(
      okResponse({ title: 'Daily limit', detail: 'Come back tomorrow.' }, 429)
    );

    await expect(getChapters()).rejects.toThrow('Daily limit');
    await expect(getChapters()).rejects.toHaveProperty('status', 429);
  });
});

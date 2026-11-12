import * as SecureStore from 'expo-secure-store';
import { fetch as expoFetch } from 'expo/fetch';
import {
  clearSession,
  loadSession,
  saveSession,
} from '../auth';
import { apiFetch, ApiError, extractKnowledge, generateChapter, getChapters, getUser, updateLearningLanguage, updateUserLanguage } from '../api';

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
  // A real Blob instance, so the spec-compliant FormData (active in the
  // Node test environment) accepts it as a part, same as File at runtime.
  File: jest.fn((uri: string) => new Blob(['image-bytes'], { type: 'image/jpeg' })),
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

describe('extractKnowledge', () => {
  it('sends every image as an Images form field in one request', async () => {
    await saveSession({ accessToken: 'token' });
    (expoFetch as jest.Mock).mockResolvedValue(okResponse({ targetLanguage: 'sv' }));

    await extractKnowledge(
      ['file:///tmp/page1.jpg', 'file:///tmp/page2.jpg', 'file:///tmp/page3.jpg'],
      'image/jpeg'
    );

    expect((expoFetch as jest.Mock)).toHaveBeenCalledTimes(1);
    const [url, init] = (expoFetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/knowledge/extract');
    expect(init.headers.Authorization).toBe('Bearer token');
    expect((init.body as FormData).getAll('Images')).toHaveLength(3);
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
            newWords: [],
            createdAt: '2026-11-04T09:00:00Z',
          },
          {
            chapterNumber: 2,
            storyTitle: 'En morgon',
            title: 'Nya vänner',
            content: 'Hej igen!',
            newWords: [{ word: 'igen', definition: 'again' }],
            createdAt: '2026-11-05T09:00:00Z',
          },
        ],
      })
    );

    const result = await getChapters();

    expect(result.chapters).toHaveLength(2);
    expect(result.chapters[0].chapterNumber).toBe(1);
    expect(result.chapters[0].content).toBe('Hej!');
    // Chapters written before per-chapter titles have no title.
    expect(result.chapters[0].title).toBeUndefined();
    expect(result.chapters[1].title).toBe('Nya vänner');
    // New words come with definitions for tap-to-learn.
    expect(result.chapters[1].newWords).toEqual([{ word: 'igen', definition: 'again' }]);
  });

  it('returns the new chapter number from generate', async () => {
    await saveSession({ accessToken: 'token' });
    (expoFetch as jest.Mock).mockResolvedValue(
      okResponse({
        chapterNumber: 3,
        story: {
          title: 'Tredje kapitlet',
          story: 'Hej igen!',
          usedVocabulary: ['hej'],
          usedGrammarPoints: [],
          potentiallyNewLanguage: ['igen'],
          summary: 'De säger hej igen.',
          newWords: [{ word: 'igen', definition: 'again' }],
        },
      })
    );

    const result = await generateChapter({
      targetLanguage: 'Swedish',
      sourceSummary: 'a page',
      vocabulary: [],
      grammarPoints: [],
      uncertainItems: [],
    });

    expect(result.chapterNumber).toBe(3);
    expect(result.story.title).toBe('Tredje kapitlet');
    expect(result.story.newWords).toEqual([{ word: 'igen', definition: 'again' }]);
  });

  it('throws ApiError with details when the request fails', async () => {
    await saveSession({ accessToken: 'token' });
    (expoFetch as jest.Mock).mockResolvedValue(
      okResponse({ title: 'Daily limit', detail: 'Come back tomorrow.' }, 429)
    );

    await expect(getChapters()).rejects.toThrow('Come back tomorrow.');
    await expect(getChapters()).rejects.toHaveProperty('status', 429);
  });
});

describe('users', () => {
  it('getUser returns the account with its language preference', async () => {
    await saveSession({ accessToken: 'token' });
    (expoFetch as jest.Mock).mockResolvedValue(
      okResponse({ userId: '63b8f3e2-0000-4000-8000-000000000001', language: 'fr' })
    );

    const user = await getUser();

    expect(user.language).toBe('fr');
    const [url, init] = (expoFetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/users/me');
    expect(init.headers.Authorization).toBe('Bearer token');
  });

  it('updateUserLanguage PATCHes the language to the account', async () => {
    await saveSession({ accessToken: 'token' });
    (expoFetch as jest.Mock).mockResolvedValue(
      okResponse({ userId: '63b8f3e2-0000-4000-8000-000000000001', language: 'en' })
    );

    const user = await updateUserLanguage('en');

    expect(user.language).toBe('en');
    const [url, init] = (expoFetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/users/me');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ language: 'en' });
  });

  it('getUser surfaces the learning language too', async () => {
    await saveSession({ accessToken: 'token' });
    (expoFetch as jest.Mock).mockResolvedValue(
      okResponse({
        userId: '63b8f3e2-0000-4000-8000-000000000001',
        learningLanguage: 'fr',
      })
    );

    const user = await getUser();

    expect(user.learningLanguage).toBe('fr');
    expect(user.language).toBeUndefined();
  });

  it('updateLearningLanguage PATCHes the studied language', async () => {
    await saveSession({ accessToken: 'token' });
    (expoFetch as jest.Mock).mockResolvedValue(
      okResponse({
        userId: '63b8f3e2-0000-4000-8000-000000000001',
        learningLanguage: 'sv',
      })
    );

    const user = await updateLearningLanguage('sv');

    expect(user.learningLanguage).toBe('sv');
    const [url, init] = (expoFetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/users/me/learning-language');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ learningLanguage: 'sv' });
  });
});

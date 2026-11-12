import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { API_URL, COGNITO } from './config';
import { clearSession, loadSession, saveSession } from './auth';

// ── API response types (camelCase, mirroring the C# records) ────────────────

export type VocabularyEntry = {
  term: string;
  baseForm: string;
  meaning: string;
  partOfSpeech: string;
  evidence: string;
};

export type GrammarPoint = {
  name: string;
  explanation: string;
  examples: string[];
};

export type NotebookKnowledge = {
  targetLanguage: string;
  sourceSummary: string;
  vocabulary: VocabularyEntry[];
  grammarPoints: GrammarPoint[];
  uncertainItems: string[];
};

export type NewWordDefinition = {
  word: string;
  /** Provided by the model (ai) or the notebook translation (extracted); may be missing. */
  definition?: string | null;
  /** 'ai' = vocabulary the story introduced (blue);
   *  'extracted' = notebook vocabulary's first appearance (green). */
  kind?: string | null;
};

/** Response of POST /api/stories/generate: the chapter number lets the
 * client redirect straight to the freshly written chapter. */
export type GenerateChapterResult = {
  chapterNumber: number;
  story: GeneratedStory;
};

export type GeneratedStory = {
  title: string;
  story: string;
  usedVocabulary: string[];
  usedGrammarPoints: string[];
  potentiallyNewLanguage: string[];
  summary?: string;
  newWords?: NewWordDefinition[];
};

export type StoryChapter = {
  chapterNumber: number;
  storyTitle: string;
  /** Per-chapter title; absent on chapters written before it existed. */
  title?: string;
  content: string;
  /** Words this chapter introduced, for the dotted underline. */
  newWords: NewWordDefinition[];
  createdAt: string;
};

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

// ── Token refresh ───────────────────────────────────────────────────────────

async function refreshAccessToken(): Promise<string | null> {
  const session = await loadSession();
  if (!session?.refreshToken) {
    return null;
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: COGNITO.clientId,
    refresh_token: session.refreshToken,
  });

  const response = await fetch(`${COGNITO.hostedUiDomain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    await clearSession();
    return null;
  }

  const tokens = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  await saveSession({
    accessToken: tokens.access_token,
    // Cognito rotates refresh tokens; keep the new one when provided.
    refreshToken: tokens.refresh_token ?? session.refreshToken,
    issuedAt: Math.floor(Date.now() / 1000),
    expiresIn: tokens.expires_in,
  });

  return tokens.access_token;
}

// ── API client ─────────────────────────────────────────────────────────────

/**
 * Authenticated fetch against the Vocabula API. Attaches the access token
 * and retries once with a refreshed token when the API answers 401.
 *
 * Uses the Expo fetch implementation (spec-compliant); multipart uploads
 * need its FormData handling with File parts.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = await loadSession();
  if (!session) {
    throw new ApiError(401, 'Not signed in');
  }

  const doFetch = (token: string) =>
    expoFetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string>),
        Authorization: `Bearer ${token}`,
      },
    });

  let response = await doFetch(session.accessToken);

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await doFetch(refreshed);
    }
  }

  return response;
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    // The API answers errors as RFC 7807 problem details; prefer the
    // human-readable fields over the raw JSON.
    let message = raw || `HTTP ${response.status}`;
    try {
      const problem = JSON.parse(raw) as { title?: string; detail?: string };
      message = problem.detail ?? problem.title ?? message;
    } catch {
      // raw body was not JSON; keep it as is
    }
    throw new ApiError(response.status, message);
  }
  return (await response.json()) as T;
}

/** Extract vocabulary and grammar from up to 10 notebook photos. */
export async function extractKnowledge(imageUris: string[], mediaType: string): Promise<NotebookKnowledge> {
  // The Expo fetch requires File parts (the legacy { uri } FormData part
  // is not supported by the spec-compliant implementation).
  const form = new FormData();
  for (const uri of imageUris) {
    const file = new File(uri.startsWith('file://') ? uri : `file://${uri}`);
    form.append('Images', file, `notebook.${mediaType === 'image/png' ? 'png' : 'jpg'}`);
  }

  return apiJson<NotebookKnowledge>('/api/knowledge/extract', {
    method: 'POST',
    body: form,
  });
}

/** Generate the next chapter of the story from freshly extracted knowledge. */
export async function generateChapter(knowledge: NotebookKnowledge): Promise<GenerateChapterResult> {
  return apiJson<GenerateChapterResult>('/api/stories/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(knowledge),
  });
}

/** All chapters of the user's story, in reading order. */
export async function getChapters(): Promise<{ chapters: StoryChapter[] }> {
  return apiJson<{ chapters: StoryChapter[] }>('/api/stories/chapters');
}

/** Languages a user can learn (kept in sync with the backend catalogue). */
export const LearningLanguageCodes = ['en', 'fr', 'es', 'sv'] as const;
export type LearningLanguageCode = (typeof LearningLanguageCodes)[number];

/** The authenticated user's account record. */
export type CurrentUser = {
  userId: string;
  /** UI language preference; null = follow the device language. */
  language?: string | null;
  /** The language the user is learning; null = not chosen yet. */
  learningLanguage?: LearningLanguageCode | null;
};

/** Current account, including the UI language preference. */
export async function getUser(): Promise<CurrentUser> {
  return apiJson<CurrentUser>('/api/users/me');
}

/** Update the language stored on the account ("en" or "fr"). */
export async function updateUserLanguage(language: string): Promise<CurrentUser> {
  return apiJson<CurrentUser>('/api/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language }),
  });
}

/**
 * Switch the learned language. Each language keeps its own knowledge and
 * chapters; the daily chapter quota is shared across all of them.
 */
export async function updateLearningLanguage(learningLanguage: LearningLanguageCode): Promise<CurrentUser> {
  return apiJson<CurrentUser>('/api/users/me/learning-language', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learningLanguage }),
  });
}

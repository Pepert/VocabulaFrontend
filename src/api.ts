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

export type GeneratedStory = {
  title: string;
  story: string;
  usedVocabulary: string[];
  usedGrammarPoints: string[];
  potentiallyNewLanguage: string[];
};

export type StoryChapter = {
  chapterNumber: number;
  storyTitle: string;
  content: string;
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
    const detail = await response.text().catch(() => '');
    throw new ApiError(response.status, detail || `HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

/** Extract vocabulary and grammar from a notebook photo. */
export async function extractKnowledge(imageUri: string, mediaType: string): Promise<NotebookKnowledge> {
  // The Expo fetch requires File parts (the legacy { uri } FormData part
  // is not supported by the spec-compliant implementation).
  const file = new File(imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`);
  const form = new FormData();
  form.append('Image', file, `notebook.${mediaType === 'image/png' ? 'png' : 'jpg'}`);

  return apiJson<NotebookKnowledge>('/api/knowledge/extract', {
    method: 'POST',
    body: form,
  });
}

/** Generate the next chapter of the story from freshly extracted knowledge. */
export async function generateChapter(knowledge: NotebookKnowledge): Promise<GeneratedStory> {
  return apiJson<GeneratedStory>('/api/stories/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(knowledge),
  });
}

/** All chapters of the user's story, in reading order. */
export async function getChapters(): Promise<{ chapters: StoryChapter[] }> {
  return apiJson<{ chapters: StoryChapter[] }>('/api/stories/chapters');
}

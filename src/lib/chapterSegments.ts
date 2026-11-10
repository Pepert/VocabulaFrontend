import type { NewWordDefinition } from '../api';

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'newWord'; text: string; entry: NewWordDefinition };

/**
 * Splits a chapter into renderable segments, marking the spans that are
 * words the chapter introduced. Matching is per letter-run (word), case
 * insensitive, so inflections of a known word ("kaffet" vs "kaffe") are
 * not underlined — only exact word forms.
 */
export function splitChapterByNewWords(
  content: string,
  newWords: NewWordDefinition[]
): Segment[] {
  if (newWords.length === 0) {
    return content ? [{ kind: 'text', text: content }] : [];
  }

  const entries = new Map(
    newWords.map((entry) => [entry.word.toLocaleLowerCase(), entry])
  );
  const letterRun = /[\p{L}]+/gu;
  const segments: Segment[] = [];
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = letterRun.exec(content)) !== null) {
    const entry = entries.get(match[0].toLocaleLowerCase());
    if (!entry) continue;

    if (match.index > lastIndex) {
      segments.push({ kind: 'text', text: content.slice(lastIndex, match.index) });
    }
    segments.push({ kind: 'newWord', text: match[0], entry });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ kind: 'text', text: content.slice(lastIndex) });
  }

  return segments;
}

import { splitChapterByNewWords } from '../lib/chapterSegments';
import type { NewWordDefinition } from '../api';

const entry = (word: string, definition: string | null = null): NewWordDefinition => ({
  word,
  definition,
});

describe('splitChapterByNewWords', () => {
  it('returns plain text when the chapter introduced no new words', () => {
    expect(splitChapterByNewWords('Hej! Jag heter Anna.', [])).toEqual([
      { kind: 'text', text: 'Hej! Jag heter Anna.' },
    ]);
  });

  it('marks every occurrence of each new word, keeping positions', () => {
    const segments = splitChapterByNewWords('— Klockan, säger han. KLOCKAN? Ja.', [
      entry('klockan', 'clock'),
    ]);

    expect(segments).toEqual([
      { kind: 'text', text: '— ' },
      { kind: 'newWord', text: 'Klockan', entry: entry('klockan', 'clock') },
      { kind: 'text', text: ', säger han. ' },
      { kind: 'newWord', text: 'KLOCKAN', entry: entry('klockan', 'clock') },
      { kind: 'text', text: '? Ja.' },
    ]);
  });

  it('carries the definition with the marked spans', () => {
    const segments = splitChapterByNewWords('Solen skiner idag.', [entry('solen', 'the sun')]);

    const marked = segments.find((s) => s.kind === 'newWord');
    expect(marked).toEqual({ kind: 'newWord', text: 'Solen', entry: entry('solen', 'the sun') });
  });

  it('does not underline parts of other words (no substring matches)', () => {
    const segments = splitChapterByNewWords('Klockigt ord.', [entry('klockan')]);

    expect(segments).toEqual([{ kind: 'text', text: 'Klockigt ord.' }]);
  });

  it('handles Swedish characters', () => {
    const segments = splitChapterByNewWords('Åäö! Fikar du?', [entry('fikar', 'has coffee')]);

    expect(segments).toEqual([
      { kind: 'text', text: 'Åäö! ' },
      { kind: 'newWord', text: 'Fikar', entry: entry('fikar', 'has coffee') },
      { kind: 'text', text: ' du?' },
    ]);
  });

  it('returns nothing for empty content', () => {
    expect(splitChapterByNewWords('', [entry('klockan')])).toEqual([]);
  });
});

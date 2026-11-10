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

  it('colors only the first occurrence of each new word', () => {
    const segments = splitChapterByNewWords('— Klockan, säger han. KLOCKAN? Ja.', [
      entry('klockan', 'clock'),
    ]);

    expect(segments).toEqual([
      { kind: 'text', text: '— ' },
      { kind: 'newWord', text: 'Klockan', entry: entry('klockan', 'clock') },
      // The second occurrence renders as plain text.
      { kind: 'text', text: ', säger han. KLOCKAN? Ja.' },
    ]);
  });

  it('carries the definition and kind with the marked span', () => {
    const extracted = { word: 'solen', definition: 'the sun', kind: 'extracted' };
    const segments = splitChapterByNewWords('Solen skiner.', [extracted]);

    expect(segments).toEqual([
      { kind: 'newWord', text: 'Solen', entry: extracted },
      { kind: 'text', text: ' skiner.' },
    ]);
  });

  it('does not mark parts of other words (no substring matches)', () => {
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

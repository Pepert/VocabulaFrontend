import { addPhotos, canAddMore, removePhoto } from '../lib/photoSelection';

// Camera shots and library picks share one list: every rule below is what
// the review screen shows, so it must hold without rendering it.
describe('addPhotos', () => {
  it('appends picks in order', () => {
    const { photos: result, dropped } = addPhotos([], ['file:///a.jpg', 'file:///b.jpg'], 10);

    expect(result.map((photo) => photo.uri)).toEqual(['file:///a.jpg', 'file:///b.jpg']);
    expect(dropped).toBe(0);
  });

  it('mixes camera shots into an existing selection', () => {
    const first = addPhotos([], ['file:///library.jpg'], 10);
    const { photos: result, dropped } = addPhotos(first.photos, ['file:///camera.jpg'], 10);

    expect(result.map((photo) => photo.uri)).toEqual([
      'file:///library.jpg',
      'file:///camera.jpg',
    ]);
    expect(dropped).toBe(0);
  });

  it('reports a duplicate as not added', () => {
    const first = addPhotos([], ['file:///a.jpg'], 10);
    const { photos: result, dropped } = addPhotos(first.photos, ['file:///a.jpg', 'file:///b.jpg'], 10);

    expect(result.map((photo) => photo.uri)).toEqual(['file:///a.jpg', 'file:///b.jpg']);
    expect(dropped).toBe(1);
  });

  it('keeps the earliest picks and reports the ones over the cap', () => {
    const first = addPhotos([], ['file:///1.jpg', 'file:///2.jpg'], 3);
    const { photos: result, dropped } = addPhotos(first.photos, ['file:///3.jpg', 'file:///4.jpg'], 3);

    expect(result.map((photo) => photo.uri)).toEqual([
      'file:///1.jpg',
      'file:///2.jpg',
      'file:///3.jpg',
    ]);
    expect(dropped).toBe(1);
  });
});

describe('removePhoto', () => {
  it('removes only the targeted photo', () => {
    const first = addPhotos([], ['file:///a.jpg', 'file:///b.jpg'], 10);
    const result = removePhoto(first.photos, 'file:///a.jpg');

    expect(result.map((photo) => photo.uri)).toEqual(['file:///b.jpg']);
  });

  it('a removed photo can be picked again', () => {
    let { photos: selection } = addPhotos([], ['file:///a.jpg'], 10);
    selection = removePhoto(selection, 'file:///a.jpg');
    ({ photos: selection } = addPhotos(selection, ['file:///a.jpg'], 10));

    expect(selection.map((photo) => photo.uri)).toEqual(['file:///a.jpg']);
  });

  it('removing makes room under the cap again', () => {
    // Cap of one: a second camera shot is refused, until the first is removed.
    let { photos: selection } = addPhotos([], ['file:///a.jpg'], 1);
    expect(canAddMore(selection, 1)).toBe(false);
    selection = removePhoto(selection, 'file:///a.jpg');
    expect(canAddMore(selection, 1)).toBe(true);
    ({ photos: selection } = addPhotos(selection, ['file:///b.jpg'], 1));
    expect(selection.map((photo) => photo.uri)).toEqual(['file:///b.jpg']);
  });
});

describe('canAddMore', () => {
  it('is true below the cap and false at it', () => {
    expect(canAddMore([], 10)).toBe(true);
    const { photos: full } = addPhotos([], ['1', '2', '3'], 3);
    expect(canAddMore(full, 3)).toBe(false);
  });
});

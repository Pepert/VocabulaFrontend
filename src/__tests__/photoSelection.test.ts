import { addPhotos, canAddMore, removePhoto } from '../lib/photoSelection';

// Camera shots and library picks share one list: every rule below is what
// the review screen shows, so it must hold without rendering it.
describe('addPhotos', () => {
  it('appends picks in order', () => {
    const result = addPhotos([], ['file:///a.jpg', 'file:///b.jpg'], 10);

    expect(result.map((photo) => photo.uri)).toEqual(['file:///a.jpg', 'file:///b.jpg']);
  });

  it('mixes camera shots into an existing selection', () => {
    const current = addPhotos([], ['file:///library.jpg'], 10);
    const result = addPhotos(current, ['file:///camera.jpg'], 10);

    expect(result.map((photo) => photo.uri)).toEqual([
      'file:///library.jpg',
      'file:///camera.jpg',
    ]);
  });

  it('ignores the same photo picked twice', () => {
    const first = addPhotos([], ['file:///a.jpg'], 10);
    const second = addPhotos(first, ['file:///a.jpg', 'file:///b.jpg'], 10);

    expect(second.map((photo) => photo.uri)).toEqual(['file:///a.jpg', 'file:///b.jpg']);
  });

  it('never exceeds the upload limit, keeping the earliest picks', () => {
    const first = addPhotos([], ['file:///1.jpg', 'file:///2.jpg'], 3);
    const second = addPhotos(first, ['file:///3.jpg', 'file:///4.jpg'], 3);

    expect(second.map((photo) => photo.uri)).toEqual([
      'file:///1.jpg',
      'file:///2.jpg',
      'file:///3.jpg',
    ]);
  });

  it('still allows filling a selection the previous shot left unbalanced', () => {
    // Two camera shots, then one more to fill the cap of three.
    let selection = addPhotos([], ['file:///1.jpg', 'file:///2.jpg'], 3);
    selection = addPhotos(selection, ['file:///3.jpg'], 3);
    selection = addPhotos(selection, ['file:///4.jpg'], 3);

    expect(selection).toHaveLength(3);
    expect(canAddMore(selection, 3)).toBe(false);
  });
});

describe('removePhoto', () => {
  it('removes only the targeted photo', () => {
    const selection = addPhotos([], ['file:///a.jpg', 'file:///b.jpg'], 10);
    const result = removePhoto(selection, 'file:///a.jpg');

    expect(result.map((photo) => photo.uri)).toEqual(['file:///b.jpg']);
  });

  it('a removed photo can be picked again', () => {
    let selection = addPhotos([], ['file:///a.jpg'], 10);
    selection = removePhoto(selection, 'file:///a.jpg');
    selection = addPhotos(selection, ['file:///a.jpg'], 10);

    expect(selection.map((photo) => photo.uri)).toEqual(['file:///a.jpg']);
  });
});

describe('canAddMore', () => {
  it('is true below the cap and false at it', () => {
    expect(canAddMore([], 10)).toBe(true);
    const full = addPhotos([], ['1', '2', '3'], 3);
    expect(canAddMore(full, 3)).toBe(false);
  });
});

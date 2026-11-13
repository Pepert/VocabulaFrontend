/**
 * The photos chosen for the next chapter, before upload. Kept as a pure
 * module so the selection rules (dedupe, cap, order) are testable without
 * rendering the capture screen.
 */

/** A photo picked from the camera or the library. */
export type SelectedPhoto = {
  id: string;
  uri: string;
};

/** The result of merging new picks into the selection. */
export type AddPhotosResult = {
  photos: SelectedPhoto[];
  /** Newly picked photos that did not make it in: duplicates or picks
   * beyond the cap. Surfaced so the UI can say so instead of silently
   * ignoring them. */
  dropped: number;
};

/**
 * Adds newly picked photos to the current selection: duplicates by uri are
 * ignored, order is preserved (camera shots and library picks share the
 * same list), and the total never exceeds `max`. Photos over the cap are
 * returned in the dropped count, matching the backend's per-upload limit.
 */
export function addPhotos(current: SelectedPhoto[], addedUris: string[], max: number): AddPhotosResult {
  const merged = [...current];
  const knownUris = new Set(merged.map((photo) => photo.uri));
  let dropped = 0;

  for (const uri of addedUris) {
    if (merged.length >= max || knownUris.has(uri)) {
      dropped++;
      continue;
    }
    knownUris.add(uri);
    merged.push({ id: uri, uri });
  }

  return { photos: merged, dropped };
}

/** Removes one photo from the selection. */
export function removePhoto(current: SelectedPhoto[], id: string): SelectedPhoto[] {
  return current.filter((photo) => photo.id !== id);
}

/** True while more photos can be added to the selection. */
export function canAddMore(current: SelectedPhoto[], max: number): boolean {
  return current.length < max;
}

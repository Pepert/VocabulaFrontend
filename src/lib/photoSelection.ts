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

/**
 * Adds newly picked photos to the current selection: duplicates by uri are
 * ignored, order is preserved (camera shots and library picks share the
 * same list), and the total never exceeds `max`. Extra photos are silently
 * dropped, matching the backend's per-upload limit.
 */
export function addPhotos(current: SelectedPhoto[], addedUris: string[], max: number): SelectedPhoto[] {
  const merged = [...current];
  const knownUris = new Set(merged.map((photo) => photo.uri));

  for (const uri of addedUris) {
    if (merged.length >= max) {
      break;
    }
    if (knownUris.has(uri)) {
      continue;
    }
    knownUris.add(uri);
    merged.push({ id: uri, uri });
  }

  return merged;
}

/** Removes one photo from the selection. */
export function removePhoto(current: SelectedPhoto[], id: string): SelectedPhoto[] {
  return current.filter((photo) => photo.id !== id);
}

/** True while more photos can be added to the selection. */
export function canAddMore(current: SelectedPhoto[], max: number): boolean {
  return current.length < max;
}

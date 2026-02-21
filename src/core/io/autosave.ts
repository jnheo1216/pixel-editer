import { AUTOSAVE_KEY, type ProjectFileV1 } from '../model/types';
import { parseProjectFile, serializeProjectFile } from './projectSerializer';

export function saveAutosave(project: ProjectFileV1): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(AUTOSAVE_KEY, serializeProjectFile(project));
  } catch {
    // localStorage quota exceeded or unavailable. App should continue without autosave.
  }
}

export function loadAutosave(): ProjectFileV1 | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTOSAVE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return parseProjectFile(raw);
  } catch {
    return null;
  }
}

export function clearAutosave(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTOSAVE_KEY);
}

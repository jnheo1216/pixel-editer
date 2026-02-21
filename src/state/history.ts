import {
  HISTORY_LIMIT,
  cloneDocument,
  type HistoryEntry,
  type HistoryState,
  type PixelDocument,
} from '../core/model/types';

export function createInitialHistoryState(maxSteps = HISTORY_LIMIT): HistoryState {
  return {
    undoStack: [],
    redoStack: [],
    maxSteps,
  };
}

export function pushHistoryEntry(history: HistoryState, entry: HistoryEntry): HistoryState {
  const nextUndo = [...history.undoStack, entry];
  const trimStart = Math.max(0, nextUndo.length - history.maxSteps);

  return {
    ...history,
    undoStack: nextUndo.slice(trimStart),
    redoStack: [],
  };
}

export function canUndo(history: HistoryState): boolean {
  return history.undoStack.length > 0;
}

export function canRedo(history: HistoryState): boolean {
  return history.redoStack.length > 0;
}

export function applyHistoryEntry(
  currentDocument: PixelDocument,
  entry: HistoryEntry,
  direction: 'undo' | 'redo',
): PixelDocument {
  if (entry.type === 'structure') {
    return cloneDocument(direction === 'undo' ? entry.before : entry.after);
  }

  const next = cloneDocument(currentDocument);
  const targetLayer = next.layers.find((layer) => layer.id === entry.layerId);

  if (!targetLayer) {
    return next;
  }

  for (const delta of entry.deltas) {
    targetLayer.pixels[delta.index] = direction === 'undo' ? delta.prev : delta.next;
  }

  return next;
}

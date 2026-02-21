import { describe, expect, it } from 'vitest';

import { cloneDocument, createInitialDocument, type HistoryEntry } from '../../core/model/types';
import { applyHistoryEntry } from '../../state/history';

describe('history application', () => {
  it('applies pixel delta on redo and restores on undo', () => {
    const document = createInitialDocument();
    const entry: HistoryEntry = {
      type: 'pixels',
      label: '그리기',
      layerId: document.activeLayerId,
      deltas: [{ index: 0, prev: 0, next: 0xff00ffff }],
    };

    const redone = applyHistoryEntry(document, entry, 'redo');
    expect(redone.layers[0].pixels[0]).toBe(0xff00ffff);

    const undone = applyHistoryEntry(redone, entry, 'undo');
    expect(undone.layers[0].pixels[0]).toBe(0);
  });

  it('uses structure snapshots on undo/redo', () => {
    const before = createInitialDocument();
    const after = cloneDocument(before);
    after.width = 12;

    const entry: HistoryEntry = {
      type: 'structure',
      label: '설정 변경',
      before,
      after,
    };

    const redone = applyHistoryEntry(before, entry, 'redo');
    const undone = applyHistoryEntry(redone, entry, 'undo');

    expect(redone.width).toBe(12);
    expect(undone.width).toBe(before.width);
  });
});

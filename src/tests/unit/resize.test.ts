import { describe, expect, it } from 'vitest';

import {
  createInitialDocument,
  resizeDocumentTopLeft,
  type PixelDocument,
} from '../../core/model/types';

function makeDocument(): PixelDocument {
  const document = createInitialDocument();
  document.width = 2;
  document.height = 2;
  document.pixelSize = 16;
  document.layers[0].pixels = Uint32Array.from([1, 2, 3, 4]);
  return document;
}

describe('resizeDocumentTopLeft', () => {
  it('expands while preserving top-left pixels and filling transparency', () => {
    const next = resizeDocumentTopLeft(makeDocument(), 3, 2, 16);
    expect(Array.from(next.layers[0].pixels)).toEqual([1, 2, 0, 3, 4, 0]);
  });

  it('shrinks by clipping overflow area from bottom-right', () => {
    const next = resizeDocumentTopLeft(makeDocument(), 1, 1, 20);
    expect(Array.from(next.layers[0].pixels)).toEqual([1]);
    expect(next.pixelSize).toBe(20);
  });
});

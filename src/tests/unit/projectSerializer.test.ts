import { describe, expect, it } from 'vitest';

import {
  cloneDocument,
  createInitialDocument,
  documentsEqual,
  sanitizeDocument,
} from '../../core/model/types';
import {
  documentToProjectFile,
  parseProjectFile,
  projectFileToDocument,
  serializeProjectFile,
} from '../../core/io/projectSerializer';

describe('project serializer', () => {
  it('serializes and parses document round-trip', () => {
    const document = createInitialDocument();
    document.layers[0].pixels[0] = 0xff0000ff;

    const duplicate = cloneDocument(document);
    duplicate.layers.push({
      id: 'layer-2',
      name: '레이어 2',
      visible: true,
      pixels: new Uint32Array(document.width * document.height),
    });
    duplicate.activeLayerId = 'layer-2';

    const serialized = serializeProjectFile(documentToProjectFile(duplicate));
    const parsed = parseProjectFile(serialized);
    const reconstructed = projectFileToDocument(parsed);

    expect(documentsEqual(sanitizeDocument(duplicate), reconstructed)).toBe(true);
  });
});

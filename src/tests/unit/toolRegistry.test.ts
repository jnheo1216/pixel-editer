import { describe, expect, it } from 'vitest';

import { TRANSPARENT_PIXEL } from '../../core/model/types';
import { resolveToolDrawColor } from '../../core/tools/toolRegistry';

describe('tool registry color resolution', () => {
  it('uses transparent pixel for eraser', () => {
    expect(resolveToolDrawColor('eraser', 0xff0000ff)).toBe(TRANSPARENT_PIXEL);
  });

  it('keeps selected color for pencil', () => {
    expect(resolveToolDrawColor('pencil', 0x123456ff)).toBe(0x123456ff);
  });
});

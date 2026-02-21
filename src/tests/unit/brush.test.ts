import { describe, expect, it } from 'vitest';

import { getBrushIndices, rasterizeLine } from '../../core/tools/brushMath';

describe('brush math', () => {
  it('returns clipped brush indices at canvas edges', () => {
    const indices = getBrushIndices({ x: 0, y: 0 }, 3, 4, 4);
    expect(indices).toEqual([0, 1, 4, 5]);
  });

  it('rasterizes continuous line points', () => {
    const points = rasterizeLine({ x: 0, y: 0 }, { x: 3, y: 3 });
    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]);
  });
});

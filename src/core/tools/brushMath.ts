import type { PixelPoint } from '../model/types';

export function rasterizeLine(start: PixelPoint, end: PixelPoint): PixelPoint[] {
  const points: PixelPoint[] = [];

  let x0 = start.x;
  let y0 = start.y;
  const x1 = end.x;
  const y1 = end.y;

  const deltaX = Math.abs(x1 - x0);
  const stepX = x0 < x1 ? 1 : -1;
  const deltaY = -Math.abs(y1 - y0);
  const stepY = y0 < y1 ? 1 : -1;

  let error = deltaX + deltaY;

  while (true) {
    points.push({ x: x0, y: y0 });

    if (x0 === x1 && y0 === y1) {
      break;
    }

    const doubled = 2 * error;

    if (doubled >= deltaY) {
      error += deltaY;
      x0 += stepX;
    }

    if (doubled <= deltaX) {
      error += deltaX;
      y0 += stepY;
    }
  }

  return points;
}

export function getBrushIndices(
  center: PixelPoint,
  brushSize: number,
  width: number,
  height: number,
): number[] {
  const indices: number[] = [];
  const half = Math.floor(brushSize / 2);

  for (let offsetY = 0; offsetY < brushSize; offsetY += 1) {
    for (let offsetX = 0; offsetX < brushSize; offsetX += 1) {
      const x = center.x + offsetX - half;
      const y = center.y + offsetY - half;

      if (x < 0 || y < 0 || x >= width || y >= height) {
        continue;
      }

      indices.push(y * width + x);
    }
  }

  return indices;
}

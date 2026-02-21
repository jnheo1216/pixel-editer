export interface GridOptions {
  originX: number;
  originY: number;
  columns: number;
  rows: number;
  cellSize: number;
  strokeStyle?: string;
  lineWidth?: number;
}

export function drawGrid(ctx: CanvasRenderingContext2D, options: GridOptions): void {
  const {
    originX,
    originY,
    columns,
    rows,
    cellSize,
    strokeStyle = 'rgba(148, 163, 184, 0.35)',
    lineWidth = 1,
  } = options;

  if (cellSize < 6) {
    return;
  }

  const width = columns * cellSize;
  const height = rows * cellSize;

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;

  for (let column = 0; column <= columns; column += 1) {
    const x = originX + column * cellSize + 0.5;
    ctx.moveTo(x, originY);
    ctx.lineTo(x, originY + height);
  }

  for (let row = 0; row <= rows; row += 1) {
    const y = originY + row * cellSize + 0.5;
    ctx.moveTo(originX, y);
    ctx.lineTo(originX + width, y);
  }

  ctx.stroke();
  ctx.restore();
}

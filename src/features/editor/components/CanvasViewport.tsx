import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';

import {
  clamp,
  getLayerIndexById,
  isPointInBounds,
  type PixelDocument,
  type PixelPoint,
  type ViewportState,
} from '../../../core/model/types';
import { composeVisiblePixels, pixelsToImageData } from '../../../core/render/compositor';
import { drawGrid } from '../../../core/render/grid';
import { getToolDefinition } from '../../../core/tools/toolRegistry';
import { useEditorStore } from '../../../state/editorStore';

interface Geometry {
  width: number;
  height: number;
  cellSize: number;
  originX: number;
  originY: number;
}

function getGeometry(
  container: HTMLElement,
  pixelDocument: PixelDocument,
  viewport: ViewportState,
): Geometry {
  const width = container.clientWidth;
  const height = container.clientHeight;
  const cellSize = pixelDocument.pixelSize * viewport.zoom;

  const canvasWidth = pixelDocument.width * cellSize;
  const canvasHeight = pixelDocument.height * cellSize;

  const originX = (width - canvasWidth) / 2 + viewport.panX;
  const originY = (height - canvasHeight) / 2 + viewport.panY;

  return {
    width,
    height,
    cellSize,
    originX,
    originY,
  };
}

function toPixelPoint(
  clientX: number,
  clientY: number,
  container: HTMLElement,
  geometry: Geometry,
): PixelPoint {
  const bounds = container.getBoundingClientRect();

  const x = Math.floor((clientX - bounds.left - geometry.originX) / geometry.cellSize);
  const y = Math.floor((clientY - bounds.top - geometry.originY) / geometry.cellSize);

  return { x, y };
}

function prepareCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D | null {
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * devicePixelRatio);
  canvas.height = Math.floor(height * devicePixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  context.imageSmoothingEnabled = false;

  return context;
}

export function CanvasViewport() {
  const pixelDocument = useEditorStore((state) => state.document);
  const viewport = useEditorStore((state) => state.ui.viewport);
  const brushSize = useEditorStore((state) => state.ui.brushSize);
  const activeTool = useEditorStore((state) => state.ui.activeTool);

  const startStroke = useEditorStore((state) => state.startStroke);
  const continueStroke = useEditorStore((state) => state.continueStroke);
  const endStroke = useEditorStore((state) => state.endStroke);
  const cancelStroke = useEditorStore((state) => state.cancelStroke);
  const panViewport = useEditorStore((state) => state.panViewport);
  const setViewport = useEditorStore((state) => state.setViewport);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const artCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawingRef = useRef(false);
  const panningRef = useRef(false);
  const panPointerRef = useRef<{ x: number; y: number } | null>(null);

  const [hoverPoint, setHoverPoint] = useState<PixelPoint | null>(null);
  const [containerVersion, setContainerVersion] = useState(0);

  const toolCursor = useMemo(() => getToolDefinition(activeTool).cursor, [activeTool]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      setContainerVersion((value) => value + 1);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const artCanvas = artCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    if (!container || !artCanvas || !overlayCanvas) {
      return;
    }

    const geometry = getGeometry(container, pixelDocument, viewport);

    const artContext = prepareCanvas(artCanvas, geometry.width, geometry.height);
    const overlayContext = prepareCanvas(overlayCanvas, geometry.width, geometry.height);

    if (!artContext || !overlayContext) {
      return;
    }

    artContext.clearRect(0, 0, geometry.width, geometry.height);
    overlayContext.clearRect(0, 0, geometry.width, geometry.height);

    const stagingCanvas = window.document.createElement('canvas');
    stagingCanvas.width = pixelDocument.width;
    stagingCanvas.height = pixelDocument.height;

    const stagingContext = stagingCanvas.getContext('2d');
    if (!stagingContext) {
      return;
    }

    stagingContext.putImageData(
      pixelsToImageData(
        composeVisiblePixels(pixelDocument),
        pixelDocument.width,
        pixelDocument.height,
      ),
      0,
      0,
    );

    artContext.drawImage(
      stagingCanvas,
      geometry.originX,
      geometry.originY,
      pixelDocument.width * geometry.cellSize,
      pixelDocument.height * geometry.cellSize,
    );

    drawGrid(overlayContext, {
      originX: geometry.originX,
      originY: geometry.originY,
      columns: pixelDocument.width,
      rows: pixelDocument.height,
      cellSize: geometry.cellSize,
    });

    overlayContext.strokeStyle = 'rgba(15, 23, 42, 0.75)';
    overlayContext.lineWidth = 1;
    overlayContext.strokeRect(
      geometry.originX + 0.5,
      geometry.originY + 0.5,
      pixelDocument.width * geometry.cellSize,
      pixelDocument.height * geometry.cellSize,
    );

    if (hoverPoint && isPointInBounds(hoverPoint, pixelDocument)) {
      const half = Math.floor(brushSize / 2);
      const previewX = hoverPoint.x - half;
      const previewY = hoverPoint.y - half;

      const screenX = geometry.originX + previewX * geometry.cellSize;
      const screenY = geometry.originY + previewY * geometry.cellSize;

      overlayContext.strokeStyle = 'rgba(15, 23, 42, 0.95)';
      overlayContext.lineWidth = 1;
      overlayContext.strokeRect(
        Math.round(screenX) + 0.5,
        Math.round(screenY) + 0.5,
        brushSize * geometry.cellSize,
        brushSize * geometry.cellSize,
      );
    }
  }, [brushSize, containerVersion, hoverPoint, pixelDocument, viewport]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (event.button === 1) {
      panningRef.current = true;
      panPointerRef.current = { x: event.clientX, y: event.clientY };
      event.preventDefault();
      return;
    }

    if (event.button !== 0) {
      return;
    }

    const geometry = getGeometry(container, pixelDocument, viewport);
    const point = toPixelPoint(event.clientX, event.clientY, container, geometry);

    if (!isPointInBounds(point, pixelDocument)) {
      return;
    }

    const activeLayerExists = getLayerIndexById(pixelDocument, pixelDocument.activeLayerId) >= 0;
    if (!activeLayerExists) {
      return;
    }

    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    startStroke(point);
    setHoverPoint(point);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (panningRef.current && panPointerRef.current) {
      const deltaX = event.clientX - panPointerRef.current.x;
      const deltaY = event.clientY - panPointerRef.current.y;
      panViewport(deltaX, deltaY);
      panPointerRef.current = { x: event.clientX, y: event.clientY };
      return;
    }

    const geometry = getGeometry(container, pixelDocument, viewport);
    const point = toPixelPoint(event.clientX, event.clientY, container, geometry);
    setHoverPoint(isPointInBounds(point, pixelDocument) ? point : null);

    if (drawingRef.current) {
      continueStroke(point);
    }
  };

  const finishPointer = (): void => {
    if (drawingRef.current) {
      endStroke();
    }

    drawingRef.current = false;
    panningRef.current = false;
    panPointerRef.current = null;
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    finishPointer();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerCancel = (): void => {
    cancelStroke();
    drawingRef.current = false;
    panningRef.current = false;
    panPointerRef.current = null;
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>): void => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      const currentGeometry = getGeometry(container, pixelDocument, viewport);
      const bounds = container.getBoundingClientRect();
      const localX = event.clientX - bounds.left;
      const localY = event.clientY - bounds.top;

      const worldX = (localX - currentGeometry.originX) / currentGeometry.cellSize;
      const worldY = (localY - currentGeometry.originY) / currentGeometry.cellSize;

      const nextZoom = clamp(
        viewport.zoom * (event.deltaY < 0 ? 1.1 : 0.9),
        0.25,
        24,
      );

      const nextCellSize = pixelDocument.pixelSize * nextZoom;
      const centeredOriginX = (currentGeometry.width - pixelDocument.width * nextCellSize) / 2;
      const centeredOriginY = (currentGeometry.height - pixelDocument.height * nextCellSize) / 2;

      const nextPanX = localX - centeredOriginX - worldX * nextCellSize;
      const nextPanY = localY - centeredOriginY - worldY * nextCellSize;

      setViewport({
        zoom: nextZoom,
        panX: nextPanX,
        panY: nextPanY,
      });

      return;
    }

    panViewport(-event.deltaX, -event.deltaY);
  };

  return (
    <section className="relative h-full overflow-hidden rounded-xl border border-slate-300 bg-[radial-gradient(circle_at_30%_20%,#ffffff_0%,#e2e8f0_45%,#cbd5e1_100%)] shadow-inner">
      <div
        ref={containerRef}
        data-testid="canvas-surface"
        className="relative h-full w-full touch-none"
        style={{ cursor: toolCursor }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setHoverPoint(null)}
        onPointerCancel={handlePointerCancel}
        onWheel={handleWheel}
      >
        <canvas ref={artCanvasRef} className="absolute inset-0" />
        <canvas ref={overlayCanvasRef} className="absolute inset-0" />
      </div>
    </section>
  );
}

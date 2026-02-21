export const TRANSPARENT_PIXEL = 0;

export const DEFAULT_CANVAS_WIDTH = 32;
export const DEFAULT_CANVAS_HEIGHT = 32;
export const DEFAULT_PIXEL_SIZE = 16;
export const DEFAULT_BRUSH_SIZE = 1;
export const DEFAULT_HITBOX_INSET_PERCENT = 20;

export const MIN_CANVAS_SIZE = 1;
export const MAX_CANVAS_SIZE = 256;
export const MIN_PIXEL_SIZE = 4;
export const MAX_PIXEL_SIZE = 40;
export const MIN_BRUSH_SIZE = 1;
export const MAX_BRUSH_SIZE = 32;
export const MIN_HITBOX_INSET_PERCENT = 0;
export const MAX_HITBOX_INSET_PERCENT = 40;

export const MAX_LAYER_COUNT = 16;
export const HISTORY_LIMIT = 100;

export const AUTOSAVE_KEY = 'pixel-editor/autosave-v1';

export type ToolId = 'pencil' | 'eraser';

export interface PixelPoint {
  x: number;
  y: number;
}

export interface LayerModel {
  id: string;
  name: string;
  visible: boolean;
  pixels: Uint32Array;
}

export interface PixelDocument {
  width: number;
  height: number;
  pixelSize: number;
  layers: LayerModel[];
  activeLayerId: string;
}

export interface PixelDelta {
  index: number;
  prev: number;
  next: number;
}

export interface PixelHistoryEntry {
  type: 'pixels';
  label: string;
  layerId: string;
  deltas: PixelDelta[];
}

export interface StructureHistoryEntry {
  type: 'structure';
  label: string;
  before: PixelDocument;
  after: PixelDocument;
}

export type HistoryEntry = PixelHistoryEntry | StructureHistoryEntry;

export interface HistoryState {
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  maxSteps: number;
}

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface UIState {
  activeTool: ToolId;
  selectedColor: number;
  brushSize: number;
  hitboxInsetPercent: number;
  viewport: ViewportState;
}

export interface StrokeSession {
  layerId: string;
  lastPoint: PixelPoint | null;
  deltas: Map<number, PixelDelta>;
}

export interface ToolPointerContext {
  point: PixelPoint;
  layerId: string;
  brushSize: number;
  color: number;
}

export interface ToolDefinition {
  id: ToolId;
  label: string;
  cursor: string;
  onPointerDown: (context: ToolPointerContext) => void;
  onPointerMove: (context: ToolPointerContext) => void;
  onPointerUp: (context: ToolPointerContext) => void;
}

export interface EditorCommand {
  label: string;
  mergeKey?: string;
  do: (document: PixelDocument) => PixelDocument;
  undo: (document: PixelDocument) => PixelDocument;
}

export interface Exporter {
  id: string;
  label: string;
  mimeType: string;
  exportFile: (document: PixelDocument) => Promise<Blob>;
}

export interface ProjectLayerV1 {
  id: string;
  name: string;
  visible: boolean;
  pixels: number[];
}

export interface ProjectFileV1 {
  version: 1;
  document: {
    width: number;
    height: number;
    pixelSize: number;
    activeLayerId: string;
    layers: ProjectLayerV1[];
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function hexToRgbaUint(hex: string): number {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return 0x000000ff;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return (((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | 0xff) >>> 0;
}

export function rgbaUintToHex(color: number): string {
  if (color === TRANSPARENT_PIXEL) {
    return '#000000';
  }

  const r = (color >>> 24) & 0xff;
  const g = (color >>> 16) & 0xff;
  const b = (color >>> 8) & 0xff;
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function isPointInBounds(point: PixelPoint, document: PixelDocument): boolean {
  return point.x >= 0 && point.y >= 0 && point.x < document.width && point.y < document.height;
}

export function getLayerIndexById(document: PixelDocument, layerId: string): number {
  return document.layers.findIndex((layer) => layer.id === layerId);
}

export function createTransparentPixels(width: number, height: number): Uint32Array {
  return new Uint32Array(width * height);
}

export function cloneLayer(layer: LayerModel): LayerModel {
  return {
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    pixels: layer.pixels.slice(),
  };
}

export function cloneDocument(document: PixelDocument): PixelDocument {
  return {
    width: document.width,
    height: document.height,
    pixelSize: document.pixelSize,
    layers: document.layers.map(cloneLayer),
    activeLayerId: document.activeLayerId,
  };
}

export function createDefaultLayer(width: number, height: number): LayerModel {
  return {
    id: 'layer-1',
    name: '레이어 1',
    visible: true,
    pixels: createTransparentPixels(width, height),
  };
}

export function createInitialDocument(): PixelDocument {
  const baseLayer = createDefaultLayer(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT);
  return {
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
    pixelSize: DEFAULT_PIXEL_SIZE,
    layers: [baseLayer],
    activeLayerId: baseLayer.id,
  };
}

export function resizePixelBuffer(
  pixels: Uint32Array,
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number,
): Uint32Array {
  const next = new Uint32Array(newWidth * newHeight);
  const copyWidth = Math.min(oldWidth, newWidth);
  const copyHeight = Math.min(oldHeight, newHeight);

  for (let y = 0; y < copyHeight; y += 1) {
    const sourceStart = y * oldWidth;
    const sourceEnd = sourceStart + copyWidth;
    const destinationStart = y * newWidth;
    next.set(pixels.subarray(sourceStart, sourceEnd), destinationStart);
  }

  return next;
}

export function resizeDocumentTopLeft(
  document: PixelDocument,
  width: number,
  height: number,
  pixelSize: number,
): PixelDocument {
  const nextWidth = clamp(Math.floor(width), MIN_CANVAS_SIZE, MAX_CANVAS_SIZE);
  const nextHeight = clamp(Math.floor(height), MIN_CANVAS_SIZE, MAX_CANVAS_SIZE);
  const nextPixelSize = clamp(Math.floor(pixelSize), MIN_PIXEL_SIZE, MAX_PIXEL_SIZE);

  const nextLayers = document.layers.map((layer) => ({
    ...layer,
    pixels: resizePixelBuffer(layer.pixels, document.width, document.height, nextWidth, nextHeight),
  }));

  const hasActiveLayer = nextLayers.some((layer) => layer.id === document.activeLayerId);

  return {
    width: nextWidth,
    height: nextHeight,
    pixelSize: nextPixelSize,
    layers: nextLayers,
    activeLayerId: hasActiveLayer ? document.activeLayerId : nextLayers[0].id,
  };
}

export function sanitizeDocument(document: PixelDocument): PixelDocument {
  const width = clamp(Math.floor(document.width), MIN_CANVAS_SIZE, MAX_CANVAS_SIZE);
  const height = clamp(Math.floor(document.height), MIN_CANVAS_SIZE, MAX_CANVAS_SIZE);
  const pixelSize = clamp(Math.floor(document.pixelSize), MIN_PIXEL_SIZE, MAX_PIXEL_SIZE);

  const limitedLayers: LayerModel[] = document.layers
    .slice(0, MAX_LAYER_COUNT)
    .map((layer, index) => {
    const expected = width * height;
    const nextPixels = new Uint32Array(expected);
    const copyCount = Math.min(layer.pixels.length, expected);
    nextPixels.set(layer.pixels.subarray(0, copyCount));

    const normalizedName = layer.name.trim() ? layer.name : `레이어 ${index + 1}`;

    return {
      id: layer.id || `layer-${index + 1}`,
      name: normalizedName,
      visible: layer.visible,
      pixels: nextPixels,
    };
    });

  if (limitedLayers.length === 0) {
    limitedLayers.push(createDefaultLayer(width, height));
  }

  const activeLayerExists = limitedLayers.some((layer) => layer.id === document.activeLayerId);

  return {
    width,
    height,
    pixelSize,
    layers: limitedLayers,
    activeLayerId: activeLayerExists ? document.activeLayerId : limitedLayers[0].id,
  };
}

export function documentsEqual(left: PixelDocument, right: PixelDocument): boolean {
  if (
    left.width !== right.width ||
    left.height !== right.height ||
    left.pixelSize !== right.pixelSize ||
    left.activeLayerId !== right.activeLayerId ||
    left.layers.length !== right.layers.length
  ) {
    return false;
  }

  for (let i = 0; i < left.layers.length; i += 1) {
    const leftLayer = left.layers[i];
    const rightLayer = right.layers[i];

    if (
      leftLayer.id !== rightLayer.id ||
      leftLayer.name !== rightLayer.name ||
      leftLayer.visible !== rightLayer.visible ||
      leftLayer.pixels.length !== rightLayer.pixels.length
    ) {
      return false;
    }

    for (let p = 0; p < leftLayer.pixels.length; p += 1) {
      if (leftLayer.pixels[p] !== rightLayer.pixels[p]) {
        return false;
      }
    }
  }

  return true;
}

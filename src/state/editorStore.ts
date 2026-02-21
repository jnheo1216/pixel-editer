import { nanoid } from 'nanoid';
import { produce } from 'immer';
import { create } from 'zustand';

import {
  DEFAULT_BRUSH_SIZE,
  HISTORY_LIMIT,
  MAX_BRUSH_SIZE,
  MAX_LAYER_COUNT,
  MIN_BRUSH_SIZE,
  clamp,
  cloneDocument,
  createInitialDocument,
  createTransparentPixels,
  documentsEqual,
  getLayerIndexById,
  hexToRgbaUint,
  isPointInBounds,
  resizeDocumentTopLeft,
  sanitizeDocument,
  type HistoryEntry,
  type PixelDocument,
  type PixelPoint,
  type StrokeSession,
  type ToolId,
  type ViewportState,
} from '../core/model/types';
import { getBrushIndices, rasterizeLine } from '../core/tools/brushMath';
import { resolveToolDrawColor } from '../core/tools/toolRegistry';
import { applyHistoryEntry, createInitialHistoryState, pushHistoryEntry } from './history';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 24;

interface ReplaceDocumentOptions {
  recordHistory?: boolean;
  label?: string;
}

export interface EditorStore {
  document: PixelDocument;
  ui: {
    activeTool: ToolId;
    selectedColor: number;
    brushSize: number;
    viewport: ViewportState;
  };
  history: ReturnType<typeof createInitialHistoryState>;
  stroke: StrokeSession | null;
  setActiveTool: (toolId: ToolId) => void;
  setSelectedColorHex: (hexColor: string) => void;
  setBrushSize: (brushSize: number) => void;
  setViewport: (nextViewport: Partial<ViewportState>) => void;
  panViewport: (deltaX: number, deltaY: number) => void;
  startStroke: (point: PixelPoint) => void;
  continueStroke: (point: PixelPoint) => void;
  endStroke: () => void;
  cancelStroke: () => void;
  addLayer: () => void;
  deleteLayer: (layerId: string) => void;
  selectLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  setLayerOrder: (layerIdsInBottomToTopOrder: string[]) => void;
  applySettings: (width: number, height: number, pixelSize: number) => void;
  undo: () => void;
  redo: () => void;
  replaceDocument: (nextDocument: PixelDocument, options?: ReplaceDocumentOptions) => void;
}

export interface InitialEditorData {
  document: PixelDocument;
  ui: EditorStore['ui'];
  history: EditorStore['history'];
  stroke: StrokeSession | null;
}

export function createInitialEditorData(): InitialEditorData {
  return {
    document: createInitialDocument(),
    ui: {
      activeTool: 'pencil',
      selectedColor: hexToRgbaUint('#0f172a'),
      brushSize: DEFAULT_BRUSH_SIZE,
      viewport: {
        zoom: 1,
        panX: 0,
        panY: 0,
      },
    },
    history: createInitialHistoryState(HISTORY_LIMIT),
    stroke: null,
  };
}

function createEmptyLayer(document: PixelDocument): PixelDocument['layers'][number] {
  return {
    id: `layer-${nanoid(8)}`,
    name: `레이어 ${document.layers.length + 1}`,
    visible: true,
    pixels: createTransparentPixels(document.width, document.height),
  };
}

function updateWithStructureHistory(
  state: EditorStore,
  label: string,
  nextDocument: PixelDocument,
): EditorStore {
  const before = cloneDocument(state.document);
  const sanitized = sanitizeDocument(nextDocument);

  if (documentsEqual(before, sanitized)) {
    return state;
  }

  const entry: HistoryEntry = {
    type: 'structure',
    label,
    before,
    after: cloneDocument(sanitized),
  };

  return {
    ...state,
    document: sanitized,
    stroke: null,
    history: pushHistoryEntry(state.history, entry),
  };
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...createInitialEditorData(),
  setActiveTool: (toolId) => {
    set((state) =>
      produce(state, (draft) => {
        draft.ui.activeTool = toolId;
      }),
    );
  },
  setSelectedColorHex: (hexColor) => {
    const color = hexToRgbaUint(hexColor);
    set((state) =>
      produce(state, (draft) => {
        draft.ui.selectedColor = color;
      }),
    );
  },
  setBrushSize: (brushSize) => {
    const nextSize = clamp(Math.floor(brushSize), MIN_BRUSH_SIZE, MAX_BRUSH_SIZE);
    set((state) =>
      produce(state, (draft) => {
        draft.ui.brushSize = nextSize;
      }),
    );
  },
  setViewport: (nextViewport) => {
    set((state) => ({
      ...state,
      ui: {
        ...state.ui,
        viewport: {
          zoom: clamp(
            nextViewport.zoom ?? state.ui.viewport.zoom,
            MIN_ZOOM,
            MAX_ZOOM,
          ),
          panX: nextViewport.panX ?? state.ui.viewport.panX,
          panY: nextViewport.panY ?? state.ui.viewport.panY,
        },
      },
    }));
  },
  panViewport: (deltaX, deltaY) => {
    set((state) => ({
      ...state,
      ui: {
        ...state.ui,
        viewport: {
          ...state.ui.viewport,
          panX: state.ui.viewport.panX + deltaX,
          panY: state.ui.viewport.panY + deltaY,
        },
      },
    }));
  },
  startStroke: (point) => {
    const state = get();
    if (!isPointInBounds(point, state.document)) {
      return;
    }

    set({
      stroke: {
        layerId: state.document.activeLayerId,
        lastPoint: point,
        deltas: new Map(),
      },
    });

    get().continueStroke(point);
  },
  continueStroke: (point) => {
    set((state) => {
      if (!state.stroke) {
        return state;
      }

      const layerIndex = getLayerIndexById(state.document, state.stroke.layerId);
      if (layerIndex === -1) {
        return {
          ...state,
          stroke: null,
        };
      }

      const nextLayers = [...state.document.layers];
      const currentLayer = nextLayers[layerIndex];
      const nextPixels = currentLayer.pixels.slice();
      nextLayers[layerIndex] = {
        ...currentLayer,
        pixels: nextPixels,
      };

      const nextDocument: PixelDocument = {
        ...state.document,
        layers: nextLayers,
      };

      const drawColor = resolveToolDrawColor(state.ui.activeTool, state.ui.selectedColor);
      const lineStart = state.stroke.lastPoint ?? point;
      const linePoints = rasterizeLine(lineStart, point);
      const brushSize = state.ui.brushSize;
      const nextDeltas = new Map(state.stroke.deltas);

      for (const linePoint of linePoints) {
        const indices = getBrushIndices(
          linePoint,
          brushSize,
          state.document.width,
          state.document.height,
        );

        for (const index of indices) {
          const previousColor = nextPixels[index];
          if (previousColor === drawColor) {
            continue;
          }

          const existing = nextDeltas.get(index);
          if (existing) {
            existing.next = drawColor;
          } else {
            nextDeltas.set(index, {
              index,
              prev: previousColor,
              next: drawColor,
            });
          }

          nextPixels[index] = drawColor;
        }
      }

      const nextStroke: StrokeSession = {
        ...state.stroke,
        lastPoint: point,
        deltas: nextDeltas,
      };

      return {
        ...state,
        document: nextDocument,
        stroke: nextStroke,
      };
    });
  },
  endStroke: () => {
    set((state) => {
      if (!state.stroke) {
        return state;
      }

      if (state.stroke.deltas.size === 0) {
        return {
          ...state,
          stroke: null,
        };
      }

      const entry: HistoryEntry = {
        type: 'pixels',
        label: state.ui.activeTool === 'eraser' ? '지우기' : '그리기',
        layerId: state.stroke.layerId,
        deltas: Array.from(state.stroke.deltas.values()),
      };

      return {
        ...state,
        stroke: null,
        history: pushHistoryEntry(state.history, entry),
      };
    });
  },
  cancelStroke: () => {
    set((state) => ({
      ...state,
      stroke: null,
    }));
  },
  addLayer: () => {
    set((state) => {
      if (state.document.layers.length >= MAX_LAYER_COUNT) {
        return state;
      }

      const nextDocument = cloneDocument(state.document);
      const newLayer = createEmptyLayer(nextDocument);
      nextDocument.layers.push(newLayer);
      nextDocument.activeLayerId = newLayer.id;

      return updateWithStructureHistory(state, '레이어 추가', nextDocument);
    });
  },
  deleteLayer: (layerId) => {
    set((state) => {
      if (state.document.layers.length <= 1) {
        return state;
      }

      const nextDocument = cloneDocument(state.document);
      const layerIndex = getLayerIndexById(nextDocument, layerId);
      if (layerIndex === -1) {
        return state;
      }

      nextDocument.layers.splice(layerIndex, 1);

      if (nextDocument.activeLayerId === layerId) {
        const fallbackLayer = nextDocument.layers[Math.max(0, layerIndex - 1)] ?? nextDocument.layers[0];
        nextDocument.activeLayerId = fallbackLayer.id;
      }

      return updateWithStructureHistory(state, '레이어 삭제', nextDocument);
    });
  },
  selectLayer: (layerId) => {
    set((state) => {
      if (!state.document.layers.some((layer) => layer.id === layerId)) {
        return state;
      }

      if (state.document.activeLayerId === layerId) {
        return state;
      }

      return {
        ...state,
        document: {
          ...state.document,
          activeLayerId: layerId,
        },
      };
    });
  },
  toggleLayerVisibility: (layerId) => {
    set((state) => {
      const layerIndex = getLayerIndexById(state.document, layerId);
      if (layerIndex === -1) {
        return state;
      }

      const nextDocument = cloneDocument(state.document);
      const currentLayer = nextDocument.layers[layerIndex];
      nextDocument.layers[layerIndex] = {
        ...currentLayer,
        visible: !currentLayer.visible,
      };

      return updateWithStructureHistory(state, '레이어 표시 변경', nextDocument);
    });
  },
  setLayerOrder: (layerIdsInBottomToTopOrder) => {
    set((state) => {
      if (layerIdsInBottomToTopOrder.length !== state.document.layers.length) {
        return state;
      }

      const layerMap = new Map(state.document.layers.map((layer) => [layer.id, layer]));
      const reordered = layerIdsInBottomToTopOrder
        .map((layerId) => layerMap.get(layerId))
        .filter((layer): layer is PixelDocument['layers'][number] => Boolean(layer));

      if (reordered.length !== state.document.layers.length) {
        return state;
      }

      const nextDocument = cloneDocument(state.document);
      nextDocument.layers = reordered.map((layer) => ({ ...layer, pixels: layer.pixels.slice() }));

      return updateWithStructureHistory(state, '레이어 순서 변경', nextDocument);
    });
  },
  applySettings: (width, height, pixelSize) => {
    set((state) => {
      const nextDocument = resizeDocumentTopLeft(state.document, width, height, pixelSize);
      return updateWithStructureHistory(state, '캔버스 설정 변경', nextDocument);
    });
  },
  undo: () => {
    set((state) => {
      if (state.history.undoStack.length === 0) {
        return state;
      }

      const nextUndoStack = state.history.undoStack.slice(0, -1);
      const lastEntry = state.history.undoStack[state.history.undoStack.length - 1];
      const nextDocument = sanitizeDocument(applyHistoryEntry(state.document, lastEntry, 'undo'));

      return {
        ...state,
        document: nextDocument,
        stroke: null,
        history: {
          ...state.history,
          undoStack: nextUndoStack,
          redoStack: [...state.history.redoStack, lastEntry],
        },
      };
    });
  },
  redo: () => {
    set((state) => {
      if (state.history.redoStack.length === 0) {
        return state;
      }

      const nextRedoStack = state.history.redoStack.slice(0, -1);
      const lastEntry = state.history.redoStack[state.history.redoStack.length - 1];
      const nextDocument = sanitizeDocument(applyHistoryEntry(state.document, lastEntry, 'redo'));

      return {
        ...state,
        document: nextDocument,
        stroke: null,
        history: {
          ...state.history,
          undoStack: [...state.history.undoStack, lastEntry],
          redoStack: nextRedoStack,
        },
      };
    });
  },
  replaceDocument: (nextDocument, options) => {
    set((state) => {
      const sanitized = sanitizeDocument(cloneDocument(nextDocument));
      const shouldRecordHistory = options?.recordHistory ?? false;

      if (!shouldRecordHistory) {
        return {
          ...state,
          document: sanitized,
          stroke: null,
        };
      }

      return updateWithStructureHistory(
        state,
        options?.label ?? '문서 불러오기',
        sanitized,
      );
    });
  },
}));

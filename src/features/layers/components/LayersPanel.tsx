import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties } from 'react';

import { DockPanel } from '../../../app/layout/DockPanel';
import type { LayerModel } from '../../../core/model/types';
import { useEditorStore } from '../../../state/editorStore';
import { LayerPreview } from './LayerPreview';

interface SortableLayerItemProps {
  layer: LayerModel;
  documentWidth: number;
  documentHeight: number;
  activeLayerId: string;
  onSelectLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  disableDelete: boolean;
}

interface LayersPanelProps {
  forceExpanded?: boolean;
}

function SortableLayerItem({
  layer,
  documentWidth,
  documentHeight,
  activeLayerId,
  onSelectLayer,
  onDeleteLayer,
  onToggleVisibility,
  disableDelete,
}: SortableLayerItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: layer.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  const selected = layer.id === activeLayerId;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={selected ? 'layer-row selected' : 'layer-row'}
      onClick={() => onSelectLayer(layer.id)}
    >
      <LayerPreview layer={layer} width={documentWidth} height={documentHeight} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{layer.name}</p>
        <p className="text-xs text-slate-500">{layer.visible ? '표시됨' : '숨김'}</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="layer-icon-button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleVisibility(layer.id);
          }}
          title="표시/숨김"
        >
          {layer.visible ? 'ON' : 'OFF'}
        </button>

        <button
          type="button"
          className="layer-icon-button"
          onClick={(event) => {
            event.stopPropagation();
            onDeleteLayer(layer.id);
          }}
          disabled={disableDelete}
          title="레이어 삭제"
        >
          ✕
        </button>

        <button
          type="button"
          className="layer-icon-button"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          title="드래그로 순서 변경"
        >
          ☰
        </button>
      </div>
    </li>
  );
}

export function LayersPanel({ forceExpanded = false }: LayersPanelProps) {
  const pixelDocument = useEditorStore((state) => state.document);
  const compactPanelsEnabled = useEditorStore((state) => state.ui.compactPanelsEnabled);
  const addLayer = useEditorStore((state) => state.addLayer);
  const deleteLayer = useEditorStore((state) => state.deleteLayer);
  const selectLayer = useEditorStore((state) => state.selectLayer);
  const toggleLayerVisibility = useEditorStore((state) => state.toggleLayerVisibility);
  const setLayerOrder = useEditorStore((state) => state.setLayerOrder);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const displayLayers = [...pixelDocument.layers].reverse();
  const displayIds = displayLayers.map((layer) => layer.id);
  const activeLayer = pixelDocument.layers.find((layer) => layer.id === pixelDocument.activeLayerId);
  const panelSummary = `${pixelDocument.layers.length}개 · ${activeLayer?.name ?? '레이어 없음'}`;
  const useCompactLayout = compactPanelsEnabled && !forceExpanded;

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = displayIds.indexOf(String(active.id));
    const newIndex = displayIds.indexOf(String(over.id));

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedDisplay = arrayMove(displayIds, oldIndex, newIndex);
    const nextBottomToTop = [...reorderedDisplay].reverse();
    setLayerOrder(nextBottomToTop);
  };

  return (
    <DockPanel
      title="레이어"
      kicker="Layer Stack"
      summary={panelSummary}
      side="right"
      forceExpanded={forceExpanded}
      panelClassName={useCompactLayout ? 'flex flex-col' : 'flex h-full flex-col'}
    >
      <div className="mb-3 flex items-center justify-end">
        <button
          type="button"
          onClick={addLayer}
          className="primary-button"
          disabled={pixelDocument.layers.length >= 16}
        >
          + 레이어
        </button>
      </div>

      <div className="layer-list-shell">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayIds} strategy={rectSortingStrategy}>
            <ol className="space-y-2">
              {displayLayers.map((layer) => (
                <SortableLayerItem
                  key={layer.id}
                  layer={layer}
                  documentWidth={pixelDocument.width}
                  documentHeight={pixelDocument.height}
                  activeLayerId={pixelDocument.activeLayerId}
                  onSelectLayer={selectLayer}
                  onDeleteLayer={deleteLayer}
                  onToggleVisibility={toggleLayerVisibility}
                  disableDelete={pixelDocument.layers.length <= 1}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      </div>

      <p className="panel-note">
        위쪽이 앞 레이어입니다. 드래그 핸들로 순서를 변경하세요.
      </p>
    </DockPanel>
  );
}

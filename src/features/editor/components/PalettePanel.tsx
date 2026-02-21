import { rgbaUintToHex } from '../../../core/model/types';
import { useEditorStore } from '../../../state/editorStore';

const PALETTE_COLORS = [
  '#0f172a',
  '#334155',
  '#94a3b8',
  '#f8fafc',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#ec4899',
  '#a855f7',
  '#7c2d12',
];

export function PalettePanel() {
  const selectedColor = useEditorStore((state) => state.ui.selectedColor);
  const setSelectedColorHex = useEditorStore((state) => state.setSelectedColorHex);

  const selectedHex = rgbaUintToHex(selectedColor);

  return (
    <section className="panel">
      <h2 className="panel-title">팔레트</h2>

      <div className="grid grid-cols-8 gap-2">
        {PALETTE_COLORS.map((hexColor) => {
          const isSelected = selectedHex.toLowerCase() === hexColor.toLowerCase();

          return (
            <button
              key={hexColor}
              type="button"
              aria-label={`색상 ${hexColor}`}
              onClick={() => setSelectedColorHex(hexColor)}
              className={isSelected ? 'palette-chip selected' : 'palette-chip'}
              style={{ backgroundColor: hexColor }}
            />
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          aria-label="사용자 정의 색상"
          type="color"
          value={selectedHex}
          onChange={(event) => setSelectedColorHex(event.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-slate-300 bg-white"
        />
        <code className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
          {selectedHex.toUpperCase()}
        </code>
      </div>
    </section>
  );
}

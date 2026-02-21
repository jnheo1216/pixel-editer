import { TOOL_DEFINITIONS } from '../../../core/tools/toolRegistry';
import { useEditorStore } from '../../../state/editorStore';

export function ToolPanel() {
  const activeTool = useEditorStore((state) => state.ui.activeTool);
  const brushSize = useEditorStore((state) => state.ui.brushSize);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const setBrushSize = useEditorStore((state) => state.setBrushSize);

  return (
    <section className="panel">
      <h2 className="panel-title">도구</h2>
      <div className="grid grid-cols-2 gap-2">
        {TOOL_DEFINITIONS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setActiveTool(tool.id)}
            className={activeTool === tool.id ? 'tool-button active' : 'tool-button'}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <label htmlFor="brush-size" className="text-sm font-semibold text-slate-700">
          브러시 크기: {brushSize}px
        </label>
        <input
          id="brush-size"
          type="range"
          min={1}
          max={32}
          step={1}
          value={brushSize}
          onChange={(event) => setBrushSize(Number(event.target.value))}
          className="w-full accent-teal-600"
        />
      </div>
    </section>
  );
}

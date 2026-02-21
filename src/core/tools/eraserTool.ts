import type { ToolDefinition } from '../model/types';

const noop: ToolDefinition['onPointerDown'] = () => {
  // Drawing is orchestrated by the editor store; tool objects provide metadata + extension hooks.
};

export const eraserTool: ToolDefinition = {
  id: 'eraser',
  label: '지우개',
  cursor: 'cell',
  onPointerDown: noop,
  onPointerMove: noop,
  onPointerUp: noop,
};

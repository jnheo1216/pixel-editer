import type { ToolDefinition } from '../model/types';

const noop: ToolDefinition['onPointerDown'] = () => {
  // Drawing is orchestrated by the editor store; tool objects provide metadata + extension hooks.
};

export const pencilTool: ToolDefinition = {
  id: 'pencil',
  label: '펜슬',
  cursor: 'crosshair',
  onPointerDown: noop,
  onPointerMove: noop,
  onPointerUp: noop,
};

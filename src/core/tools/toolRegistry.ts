import {
  TRANSPARENT_PIXEL,
  type ToolDefinition,
  type ToolId,
} from '../model/types';
import { eraserTool } from './eraserTool';
import { pencilTool } from './pencilTool';

const tools = [pencilTool, eraserTool] as const;

const toolMap = new Map<ToolId, ToolDefinition>(tools.map((tool) => [tool.id, tool]));

export const TOOL_DEFINITIONS: readonly ToolDefinition[] = tools;

export function getToolDefinition(toolId: ToolId): ToolDefinition {
  return toolMap.get(toolId) ?? pencilTool;
}

export function resolveToolDrawColor(toolId: ToolId, selectedColor: number): number {
  if (toolId === 'eraser') {
    return TRANSPARENT_PIXEL;
  }

  return selectedColor;
}

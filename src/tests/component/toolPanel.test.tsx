import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { ToolPanel } from '../../features/editor/components/ToolPanel';
import { useEditorStore } from '../../state/editorStore';
import { resetEditorStore } from '../testUtils';

describe('ToolPanel', () => {
  beforeEach(() => {
    resetEditorStore();
  });

  it('changes active tool when clicked', async () => {
    const user = userEvent.setup();
    render(<ToolPanel />);

    await user.click(screen.getByRole('button', { name: '지우개' }));
    expect(useEditorStore.getState().ui.activeTool).toBe('eraser');
  });

  it('opens popover panel when compact mode is enabled', async () => {
    const user = userEvent.setup();
    useEditorStore.setState((state) => ({
      ...state,
      ui: {
        ...state.ui,
        compactPanelsEnabled: true,
      },
    }));

    render(<ToolPanel />);

    expect(screen.queryByRole('button', { name: '지우개' })).not.toBeInTheDocument();

    const trigger = screen.getByRole('button', { name: /도구/ });
    await user.click(trigger);

    const wrapper = trigger.parentElement;
    if (!wrapper) {
      throw new Error('dock panel wrapper not found');
    }
    fireEvent.mouseLeave(wrapper);
    expect(screen.getByRole('button', { name: '지우개' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('button', { name: '지우개' })).not.toBeInTheDocument();

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: '지우개' }));

    expect(useEditorStore.getState().ui.activeTool).toBe('eraser');
  });
});

import { render, screen } from '@testing-library/react';
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
});

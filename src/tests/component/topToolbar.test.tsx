import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TopToolbar } from '../../app/layout/TopToolbar';
import { useEditorStore } from '../../state/editorStore';
import { resetEditorStore } from '../testUtils';

describe('TopToolbar undo/redo', () => {
  beforeEach(() => {
    resetEditorStore();
  });

  it('undoes and redoes drawing action from buttons', () => {
    act(() => {
      const store = useEditorStore.getState();
      store.startStroke({ x: 0, y: 0 });
      store.endStroke();
    });

    render(<TopToolbar />);

    const undoButton = screen.getByRole('button', { name: '실행 취소' });
    const redoButton = screen.getByRole('button', { name: '다시 실행' });

    act(() => {
      fireEvent.click(undoButton);
    });

    expect(useEditorStore.getState().document.layers[0].pixels[0]).toBe(0);

    act(() => {
      fireEvent.click(redoButton);
    });

    expect(useEditorStore.getState().document.layers[0].pixels[0]).not.toBe(0);
  });

  it('shows an alert when png export is unavailable', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {
      // noop for test
    });

    render(<TopToolbar />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'PNG 다운로드' }));
    });

    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('toggles compact panel mode from the toolbar', () => {
    render(<TopToolbar />);

    const toggleButton = screen.getByRole('button', { name: '패널 미니 모드' });
    expect(toggleButton).toHaveAttribute('aria-pressed', 'false');

    act(() => {
      fireEvent.click(toggleButton);
    });

    expect(useEditorStore.getState().ui.compactPanelsEnabled).toBe(true);
    expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
  });
});

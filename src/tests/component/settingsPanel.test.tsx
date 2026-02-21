import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { SettingsPanel } from '../../features/editor/components/SettingsPanel';
import { useEditorStore } from '../../state/editorStore';
import { resetEditorStore } from '../testUtils';

describe('SettingsPanel', () => {
  beforeEach(() => {
    resetEditorStore();
  });

  it('applies width, height, and pixel size changes', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);

    const widthInput = screen.getByLabelText('가로');
    const heightInput = screen.getByLabelText('세로');
    const pixelSizeInput = screen.getByLabelText('픽셀 크기');

    await user.clear(widthInput);
    await user.type(widthInput, '40');
    await user.clear(heightInput);
    await user.type(heightInput, '20');
    await user.clear(pixelSizeInput);
    await user.type(pixelSizeInput, '10');

    await user.click(screen.getByRole('button', { name: '캔버스 적용' }));

    const document = useEditorStore.getState().document;
    expect(document.width).toBe(40);
    expect(document.height).toBe(20);
    expect(document.pixelSize).toBe(10);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { LayersPanel } from '../../features/layers/components/LayersPanel';
import { useEditorStore } from '../../state/editorStore';
import { resetEditorStore } from '../testUtils';

describe('LayersPanel', () => {
  beforeEach(() => {
    resetEditorStore();
  });

  it('adds and deletes a layer', async () => {
    const user = userEvent.setup();
    render(<LayersPanel />);

    await user.click(screen.getByRole('button', { name: '+ 레이어' }));
    expect(useEditorStore.getState().document.layers).toHaveLength(2);

    const deleteButtons = screen.getAllByTitle('레이어 삭제');
    await user.click(deleteButtons[0]);

    expect(useEditorStore.getState().document.layers).toHaveLength(1);
  });
});

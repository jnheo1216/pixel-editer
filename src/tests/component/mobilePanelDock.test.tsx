import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { MobilePanelDock } from '../../app/layout/MobilePanelDock';
import { useEditorStore } from '../../state/editorStore';
import { resetEditorStore } from '../testUtils';

describe('MobilePanelDock', () => {
  beforeEach(() => {
    resetEditorStore();
  });

  it('switches panel content by tab', async () => {
    const user = userEvent.setup();
    render(<MobilePanelDock />);

    expect(screen.getByRole('slider', { name: /브러시 크기/ })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '레이어' }));
    expect(screen.getByRole('button', { name: '+ 레이어' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '설정' }));
    expect(screen.getByRole('button', { name: '캔버스 적용' })).toBeInTheDocument();
  });

  it('keeps full panel UI even when compact mode is enabled', () => {
    useEditorStore.setState((state) => ({
      ...state,
      ui: {
        ...state.ui,
        compactPanelsEnabled: true,
      },
    }));

    render(<MobilePanelDock />);
    expect(screen.getByRole('slider', { name: /브러시 크기/ })).toBeInTheDocument();
  });
});

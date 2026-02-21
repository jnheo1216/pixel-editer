import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { CanvasViewport } from '../../features/editor/components/CanvasViewport';
import { useEditorStore } from '../../state/editorStore';
import { resetEditorStore } from '../testUtils';

describe('CanvasViewport', () => {
  beforeEach(() => {
    resetEditorStore();
  });

  it('paints pixel on pointer interaction', () => {
    render(
      <div style={{ width: 640, height: 640 }}>
        <CanvasViewport />
      </div>,
    );

    const surface = screen.getByTestId('canvas-surface');

    Object.defineProperty(surface, 'clientWidth', {
      configurable: true,
      value: 640,
    });

    Object.defineProperty(surface, 'clientHeight', {
      configurable: true,
      value: 640,
    });

    surface.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: 640,
        bottom: 640,
        width: 640,
        height: 640,
        toJSON: () => ({}),
      }) as DOMRect;

    fireEvent.pointerDown(surface, {
      button: 0,
      clientX: 72,
      clientY: 72,
      pointerId: 1,
    });
    fireEvent.pointerUp(surface, {
      button: 0,
      clientX: 72,
      clientY: 72,
      pointerId: 1,
    });

    const layer = useEditorStore.getState().document.layers[0];
    expect(layer.pixels[0]).not.toBe(0);
  });
});

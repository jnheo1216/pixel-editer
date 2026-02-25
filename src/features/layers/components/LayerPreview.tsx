import { useEffect, useRef } from 'react';

import { createLayerImageData } from '../../../core/render/compositor';
import type { LayerModel } from '../../../core/model/types';

interface LayerPreviewProps {
  layer: LayerModel;
  width: number;
  height: number;
}

export function LayerPreview({ layer, width, height }: LayerPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    canvas.width = 48;
    canvas.height = 48;

    context.clearRect(0, 0, 48, 48);

    context.fillStyle = '#f8efcf';
    context.fillRect(0, 0, 48, 48);
    context.fillStyle = '#e9dba9';

    for (let y = 0; y < 6; y += 1) {
      for (let x = 0; x < 6; x += 1) {
        if ((x + y) % 2 === 0) {
          context.fillRect(x * 8, y * 8, 8, 8);
        }
      }
    }

    const stagingCanvas = window.document.createElement('canvas');
    stagingCanvas.width = width;
    stagingCanvas.height = height;

    const stagingContext = stagingCanvas.getContext('2d');
    if (!stagingContext) {
      return;
    }

    stagingContext.putImageData(createLayerImageData(layer, width, height), 0, 0);

    context.imageSmoothingEnabled = false;
    context.drawImage(stagingCanvas, 0, 0, 48, 48);

    if (!layer.visible) {
      context.fillStyle = 'rgba(27, 35, 51, 0.42)';
      context.fillRect(0, 0, 48, 48);
    }
  }, [layer, width, height]);

  return <canvas ref={canvasRef} className="layer-preview-canvas" />;
}

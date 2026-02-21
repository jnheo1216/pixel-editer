import {
  TRANSPARENT_PIXEL,
  type LayerModel,
  type PixelDocument,
} from '../model/types';

export function composeVisiblePixels(pixelDocument: PixelDocument): Uint32Array {
  const composed = new Uint32Array(pixelDocument.width * pixelDocument.height);

  for (const layer of pixelDocument.layers) {
    if (!layer.visible) {
      continue;
    }

    applyLayerPixels(composed, layer);
  }

  return composed;
}

function applyLayerPixels(target: Uint32Array, layer: LayerModel): void {
  for (let i = 0; i < layer.pixels.length; i += 1) {
    const color = layer.pixels[i];
    if (color !== TRANSPARENT_PIXEL) {
      target[i] = color;
    }
  }
}

export function pixelsToImageData(
  pixels: Uint32Array,
  width: number,
  height: number,
): ImageData {
  const bytes = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < pixels.length; i += 1) {
    const color = pixels[i];
    const byteIndex = i * 4;

    if (color === TRANSPARENT_PIXEL) {
      bytes[byteIndex] = 0;
      bytes[byteIndex + 1] = 0;
      bytes[byteIndex + 2] = 0;
      bytes[byteIndex + 3] = 0;
      continue;
    }

    bytes[byteIndex] = (color >>> 24) & 0xff;
    bytes[byteIndex + 1] = (color >>> 16) & 0xff;
    bytes[byteIndex + 2] = (color >>> 8) & 0xff;
    bytes[byteIndex + 3] = color & 0xff;
  }

  return new ImageData(bytes, width, height);
}

export function createLayerImageData(layer: LayerModel, width: number, height: number): ImageData {
  return pixelsToImageData(layer.pixels, width, height);
}

export function createDocumentImageData(pixelDocument: PixelDocument): ImageData {
  return pixelsToImageData(
    composeVisiblePixels(pixelDocument),
    pixelDocument.width,
    pixelDocument.height,
  );
}

import type { PixelDocument } from '../model/types';
import { composeVisiblePixels, pixelsToImageData } from '../render/compositor';

export async function createPngBlob(pixelDocument: PixelDocument): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = pixelDocument.width;
  canvas.height = pixelDocument.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');
  }

  context.imageSmoothingEnabled = false;
  const pixels = composeVisiblePixels(pixelDocument);
  context.putImageData(pixelsToImageData(pixels, pixelDocument.width, pixelDocument.height), 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });

  if (!blob) {
    throw new Error('PNG를 생성하지 못했습니다.');
  }

  return blob;
}

export async function downloadPng(pixelDocument: PixelDocument, fileName = 'pixel-art.png'): Promise<void> {
  const blob = await createPngBlob(pixelDocument);
  downloadBlob(blob, fileName);
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

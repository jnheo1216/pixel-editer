import '@testing-library/jest-dom/vitest';

if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = function setPointerCapture(): void {
    // jsdom pointer capture noop
  };
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = function releasePointerCapture(): void {
    // jsdom pointer capture noop
  };
}

if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = function hasPointerCapture(): boolean {
    return false;
  };
}

const mock2DContext: Partial<CanvasRenderingContext2D> = {
  setTransform: () => undefined,
  clearRect: () => undefined,
  putImageData: () => undefined,
  drawImage: () => undefined,
  beginPath: () => undefined,
  moveTo: () => undefined,
  lineTo: () => undefined,
  stroke: () => undefined,
  save: () => undefined,
  restore: () => undefined,
  strokeRect: () => undefined,
  fillRect: () => undefined,
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value(contextId: string): CanvasRenderingContext2D | null {
    if (contextId === '2d') {
      return mock2DContext as CanvasRenderingContext2D;
    }

    return null;
  },
});

if (typeof ImageData === 'undefined') {
  class MockImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;

    constructor(data: Uint8ClampedArray, width: number, height: number) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  }

  (globalThis as { ImageData: typeof MockImageData }).ImageData = MockImageData;
}

Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  configurable: true,
  value(callback: BlobCallback): void {
    callback(null);
  },
});

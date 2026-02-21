import { useMemo, useRef } from 'react';

import { useEditorStore } from '../../../state/editorStore';

export function SettingsPanel() {
  const pixelDocument = useEditorStore((state) => state.document);
  const applySettings = useEditorStore((state) => state.applySettings);

  const widthRef = useRef<HTMLInputElement | null>(null);
  const heightRef = useRef<HTMLInputElement | null>(null);
  const pixelSizeRef = useRef<HTMLInputElement | null>(null);

  const formKey = useMemo(
    () => `${pixelDocument.width}-${pixelDocument.height}-${pixelDocument.pixelSize}`,
    [pixelDocument.width, pixelDocument.height, pixelDocument.pixelSize],
  );

  const handleApply = (): void => {
    const nextWidth = Number.parseInt(
      widthRef.current?.value ?? String(pixelDocument.width),
      10,
    );
    const nextHeight = Number.parseInt(
      heightRef.current?.value ?? String(pixelDocument.height),
      10,
    );
    const nextPixelSize = Number.parseInt(
      pixelSizeRef.current?.value ?? String(pixelDocument.pixelSize),
      10,
    );

    applySettings(nextWidth, nextHeight, nextPixelSize);
  };

  return (
    <section className="panel">
      <h2 className="panel-title">설정</h2>
      <p className="mb-3 text-xs text-slate-600">캔버스 범위: 1~256, 픽셀 크기: 4~40</p>

      <div key={formKey} className="space-y-2">
        <label className="settings-row">
          <span>가로</span>
          <input
            ref={widthRef}
            type="number"
            min={1}
            max={256}
            defaultValue={pixelDocument.width}
            className="settings-input"
          />
        </label>

        <label className="settings-row">
          <span>세로</span>
          <input
            ref={heightRef}
            type="number"
            min={1}
            max={256}
            defaultValue={pixelDocument.height}
            className="settings-input"
          />
        </label>

        <label className="settings-row">
          <span>픽셀 크기</span>
          <input
            ref={pixelSizeRef}
            type="number"
            min={4}
            max={40}
            defaultValue={pixelDocument.pixelSize}
            className="settings-input"
          />
        </label>
      </div>

      <button type="button" onClick={handleApply} className="primary-button mt-4 w-full">
        캔버스 적용
      </button>
    </section>
  );
}

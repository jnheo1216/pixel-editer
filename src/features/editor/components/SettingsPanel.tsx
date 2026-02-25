import { useMemo, useRef } from 'react';

import { DockPanel } from '../../../app/layout/DockPanel';
import { useEditorStore } from '../../../state/editorStore';

export function SettingsPanel() {
  const pixelDocument = useEditorStore((state) => state.document);
  const hitboxInsetPercent = useEditorStore((state) => state.ui.hitboxInsetPercent);
  const applySettings = useEditorStore((state) => state.applySettings);
  const setHitboxInsetPercent = useEditorStore((state) => state.setHitboxInsetPercent);

  const widthRef = useRef<HTMLInputElement | null>(null);
  const heightRef = useRef<HTMLInputElement | null>(null);
  const pixelSizeRef = useRef<HTMLInputElement | null>(null);

  const formKey = useMemo(
    () => `${pixelDocument.width}-${pixelDocument.height}-${pixelDocument.pixelSize}`,
    [pixelDocument.width, pixelDocument.height, pixelDocument.pixelSize],
  );
  const panelSummary = `${pixelDocument.width}×${pixelDocument.height} / ${pixelDocument.pixelSize}px`;

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
    <DockPanel title="설정" kicker="Canvas Rules" summary={panelSummary}>
      <p className="panel-note">캔버스 범위: 1~256, 픽셀 크기: 4~40</p>

      <div key={formKey} className="mt-3 space-y-2">
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

      <label htmlFor="hitbox-inset" className="field-label mt-4">
        픽셀 인식 여백: {hitboxInsetPercent}%
      </label>
      <input
        id="hitbox-inset"
        type="range"
        min={0}
        max={40}
        step={1}
        value={hitboxInsetPercent}
        onChange={(event) => setHitboxInsetPercent(Number(event.target.value))}
        className="pixel-range"
      />
      <p className="settings-helper">
        값이 클수록 픽셀 중심에 가까운 클릭만 인식합니다.
      </p>

      <button type="button" onClick={handleApply} className="primary-button mt-4 w-full">
        캔버스 적용
      </button>
    </DockPanel>
  );
}

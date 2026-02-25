import { useState } from 'react';

import { PalettePanel } from '../../features/editor/components/PalettePanel';
import { SettingsPanel } from '../../features/editor/components/SettingsPanel';
import { ToolPanel } from '../../features/editor/components/ToolPanel';
import { LayersPanel } from '../../features/layers/components/LayersPanel';

type MobilePanelTab = 'tools' | 'palette' | 'settings' | 'layers';

const TAB_LABELS: Array<{ id: MobilePanelTab; label: string }> = [
  { id: 'tools', label: '도구' },
  { id: 'palette', label: '색상' },
  { id: 'settings', label: '설정' },
  { id: 'layers', label: '레이어' },
];

export function MobilePanelDock() {
  const [activeTab, setActiveTab] = useState<MobilePanelTab>('tools');

  return (
    <section className="mobile-panel-dock" aria-label="모바일 편집 패널">
      <div className="mobile-panel-dock__header">
        <p className="mobile-panel-dock__title">빠른 편집 패널</p>
        <p className="mobile-panel-dock__hint">탭을 눌러 도구를 전환하세요.</p>
      </div>

      <div className="mobile-panel-tabs" role="tablist" aria-label="편집 패널 탭">
        {TAB_LABELS.map((tab) => {
          const selected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={selected ? 'mobile-panel-tab is-active' : 'mobile-panel-tab'}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mobile-panel-body">
        {activeTab === 'tools' && <ToolPanel forceExpanded />}
        {activeTab === 'palette' && <PalettePanel forceExpanded />}
        {activeTab === 'settings' && <SettingsPanel forceExpanded />}
        {activeTab === 'layers' && <LayersPanel forceExpanded />}
      </div>
    </section>
  );
}

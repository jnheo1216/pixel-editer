import { useEffect, useState } from 'react';

import { clearAutosave, loadAutosave, saveAutosave } from '../core/io/autosave';
import { documentToProjectFile, projectFileToDocument } from '../core/io/projectSerializer';
import type { ProjectFileV1 } from '../core/model/types';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useEditorStore } from '../state/editorStore';
import { TopToolbar } from './layout/TopToolbar';
import { CanvasViewport } from '../features/editor/components/CanvasViewport';
import { PalettePanel } from '../features/editor/components/PalettePanel';
import { SettingsPanel } from '../features/editor/components/SettingsPanel';
import { ToolPanel } from '../features/editor/components/ToolPanel';
import { LayersPanel } from '../features/layers/components/LayersPanel';
import { MobilePanelDock } from './layout/MobilePanelDock';

const MOBILE_BREAKPOINT_PX = 880;

function getIsMobileLayout(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth <= MOBILE_BREAKPOINT_PX;
}

export function AppShell() {
  useKeyboardShortcuts();

  const pixelDocument = useEditorStore((state) => state.document);
  const replaceDocument = useEditorStore((state) => state.replaceDocument);
  const compactPanelsEnabled = useEditorStore((state) => state.ui.compactPanelsEnabled);
  const panelModeKey = compactPanelsEnabled ? 'compact' : 'full';

  const [recoveryProject, setRecoveryProject] = useState<ProjectFileV1 | null>(() => loadAutosave());
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(() => getIsMobileLayout());

  useEffect(() => {
    const handleResize = (): void => {
      setIsMobileLayout(getIsMobileLayout());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (recoveryProject) {
      return;
    }

    const timeout = window.setTimeout(() => {
      saveAutosave(documentToProjectFile(pixelDocument));
    }, 750);

    return () => window.clearTimeout(timeout);
  }, [pixelDocument, recoveryProject]);

  const handleRestoreAutosave = (): void => {
    if (!recoveryProject) {
      return;
    }

    replaceDocument(projectFileToDocument(recoveryProject), {
      recordHistory: false,
    });
    setRecoveryProject(null);
  };

  const handleDismissAutosave = (): void => {
    clearAutosave();
    setRecoveryProject(null);
  };

  return (
    <div className="app-shell">
      <TopToolbar />

      {recoveryProject && (
        <div className="status-banner">
          <div className="status-banner__inner">
            <p>이전에 자동 저장된 작업을 찾았습니다. 복구하시겠어요?</p>
            <div className="status-banner__actions">
              <button type="button" onClick={handleRestoreAutosave} className="toolbar-button">
                복구
              </button>
              <button type="button" onClick={handleDismissAutosave} className="toolbar-button">
                무시
              </button>
            </div>
          </div>
        </div>
      )}

      {isMobileLayout ? (
        <main className="app-main app-main--mobile">
          <section className="workspace-canvas">
            <CanvasViewport />
          </section>
          <MobilePanelDock />
        </main>
      ) : (
        <main className={compactPanelsEnabled ? 'app-main app-main--compact-panels' : 'app-main'}>
          <aside className="workspace-column workspace-column--left">
            <div className={compactPanelsEnabled ? 'panel-stack panel-stack--compact' : 'panel-stack'}>
              <ToolPanel key={`tool-${panelModeKey}`} />
              <PalettePanel key={`palette-${panelModeKey}`} />
              <SettingsPanel key={`settings-${panelModeKey}`} />
            </div>
          </aside>

          <section className="workspace-canvas">
            <CanvasViewport />
          </section>

          <aside className="workspace-column workspace-column--right">
            <div className={compactPanelsEnabled ? 'panel-stack panel-stack--compact' : 'panel-stack'}>
              <LayersPanel key={`layers-${panelModeKey}`} />
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}

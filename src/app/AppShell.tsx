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

export function AppShell() {
  useKeyboardShortcuts();

  const pixelDocument = useEditorStore((state) => state.document);
  const replaceDocument = useEditorStore((state) => state.replaceDocument);

  const [recoveryProject, setRecoveryProject] = useState<ProjectFileV1 | null>(() => loadAutosave());

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

      <main className="app-main">
        <aside className="workspace-column workspace-column--left">
          <div className="panel-stack">
            <ToolPanel />
            <PalettePanel />
            <SettingsPanel />
          </div>
        </aside>

        <section className="workspace-canvas">
          <CanvasViewport />
        </section>

        <aside className="workspace-column workspace-column--right">
          <div className="panel-stack">
            <LayersPanel />
          </div>
        </aside>
      </main>
    </div>
  );
}

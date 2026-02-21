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
    <div className="flex min-h-screen flex-col bg-[linear-gradient(145deg,#ecfeff_0%,#f8fafc_35%,#e2e8f0_100%)] text-slate-900">
      <TopToolbar />

      {recoveryProject && (
        <div className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-900">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
            <p>이전에 자동 저장된 작업을 찾았습니다. 복구하시겠어요?</p>
            <div className="flex items-center gap-2">
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

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 gap-3 p-3 max-lg:flex-col">
        <aside className="w-[280px] space-y-3 max-lg:w-full">
          <ToolPanel />
          <PalettePanel />
          <SettingsPanel />
        </aside>

        <section className="min-h-[520px] min-w-0 flex-1">
          <CanvasViewport />
        </section>

        <aside className="w-[340px] max-lg:w-full">
          <LayersPanel />
        </aside>
      </main>
    </div>
  );
}

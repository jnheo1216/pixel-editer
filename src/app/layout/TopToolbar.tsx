import { useRef, type ChangeEvent } from 'react';

import { downloadBlob, downloadPng } from '../../core/io/exportPng';
import {
  documentToProjectFile,
  parseProjectFile,
  projectFileToDocument,
  serializeProjectFile,
} from '../../core/io/projectSerializer';
import { useEditorStore } from '../../state/editorStore';

export function TopToolbar() {
  const pixelDocument = useEditorStore((state) => state.document);
  const history = useEditorStore((state) => state.history);
  const viewport = useEditorStore((state) => state.ui.viewport);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const replaceDocument = useEditorStore((state) => state.replaceDocument);
  const setViewport = useEditorStore((state) => state.setViewport);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleExportPng = async (): Promise<void> => {
    try {
      await downloadPng(pixelDocument, 'pixel-art.png');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'PNG를 생성하는 중 오류가 발생했습니다.';
      window.alert(message);
    }
  };

  const handleExportJson = (): void => {
    const project = documentToProjectFile(pixelDocument);
    const blob = new Blob([serializeProjectFile(project)], {
      type: 'application/json;charset=utf-8',
    });

    downloadBlob(blob, 'pixel-project.json');
  };

  const handleImportJson = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const projectFile = parseProjectFile(raw);
      replaceDocument(projectFileToDocument(projectFile), {
        recordHistory: true,
        label: '프로젝트 불러오기',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '프로젝트 파일을 읽는 중 오류가 발생했습니다.';
      window.alert(message);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <header className="border-b border-slate-300/90 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold tracking-tight text-slate-900">Pixel Editer</h1>
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-900">
            v1
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={history.undoStack.length === 0}
            className="toolbar-button"
          >
            실행 취소
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={history.redoStack.length === 0}
            className="toolbar-button"
          >
            다시 실행
          </button>

          <div className="h-6 w-px bg-slate-300" />

          <button
            type="button"
            onClick={() =>
              setViewport({
                zoom: viewport.zoom * 1.15,
              })
            }
            className="toolbar-button"
          >
            확대
          </button>
          <button
            type="button"
            onClick={() =>
              setViewport({
                zoom: viewport.zoom / 1.15,
              })
            }
            className="toolbar-button"
          >
            축소
          </button>
          <button
            type="button"
            onClick={() => setViewport({ zoom: 1, panX: 0, panY: 0 })}
            className="toolbar-button"
          >
            뷰 리셋
          </button>

          <div className="h-6 w-px bg-slate-300" />

          <button type="button" onClick={handleExportPng} className="toolbar-button">
            PNG 다운로드
          </button>
          <button type="button" onClick={handleExportJson} className="toolbar-button">
            JSON 저장
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="toolbar-button"
          >
            JSON 불러오기
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportJson}
          />
        </div>
      </div>
    </header>
  );
}

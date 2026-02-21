import { createInitialEditorData, useEditorStore } from '../state/editorStore';

export function resetEditorStore(): void {
  const initial = createInitialEditorData();

  useEditorStore.setState((state) => ({
    ...state,
    ...initial,
  }));
}

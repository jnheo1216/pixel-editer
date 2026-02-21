import { useEffect } from 'react';

import { useEditorStore } from '../state/editorStore';

function isTypingElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const usesModifier = event.metaKey || event.ctrlKey;
      const typing = isTypingElement(event.target);

      if (typing && !usesModifier) {
        return;
      }

      const store = useEditorStore.getState();

      const isUndo = usesModifier && !event.shiftKey && event.key.toLowerCase() === 'z';
      const isRedoByShift = usesModifier && event.shiftKey && event.key.toLowerCase() === 'z';
      const isRedoByY = usesModifier && event.key.toLowerCase() === 'y';

      if (isUndo) {
        event.preventDefault();
        store.undo();
        return;
      }

      if (isRedoByShift || isRedoByY) {
        event.preventDefault();
        store.redo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

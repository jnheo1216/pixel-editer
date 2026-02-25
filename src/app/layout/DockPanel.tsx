import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { useEditorStore } from '../../state/editorStore';

interface DockPanelProps {
  title: string;
  kicker: string;
  summary: string;
  side?: 'left' | 'right';
  panelClassName?: string;
  children: ReactNode;
}

function buildPanelClassName(panelClassName?: string): string {
  return panelClassName ? `panel ${panelClassName}` : 'panel';
}

export function DockPanel({
  title,
  kicker,
  summary,
  side = 'left',
  panelClassName,
  children,
}: DockPanelProps) {
  const compactPanelsEnabled = useEditorStore((state) => state.ui.compactPanelsEnabled);
  const [isExpanded, setIsExpanded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const headingId = useId();
  const panelId = useId();

  useEffect(() => {
    if (!compactPanelsEnabled || !isExpanded) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (wrapperRef.current?.contains(target)) {
        return;
      }

      setIsExpanded(false);
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') {
        return;
      }

      setIsExpanded(false);
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [compactPanelsEnabled, isExpanded]);

  const basePanelClassName = buildPanelClassName(panelClassName);

  if (!compactPanelsEnabled) {
    return (
      <section className={basePanelClassName}>
        <h2 id={headingId} className="panel-title">
          {title}
        </h2>
        <p className="panel-kicker">{kicker}</p>
        {children}
      </section>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={isExpanded ? 'dock-panel dock-panel--expanded' : 'dock-panel'}
    >
      <button
        type="button"
        className="dock-panel__trigger"
        onClick={() => setIsExpanded((previous) => !previous)}
        aria-expanded={isExpanded}
        aria-controls={panelId}
      >
        <span className="dock-panel__title">{title}</span>
        <span className="dock-panel__summary" title={summary}>
          {summary}
        </span>
      </button>

      <section
        id={panelId}
        className={`${basePanelClassName} dock-panel__popover dock-panel__popover--${side}`}
        hidden={!isExpanded}
        aria-labelledby={headingId}
      >
        <h2 id={headingId} className="panel-title">
          {title}
        </h2>
        <p className="panel-kicker">{kicker}</p>
        {children}
      </section>
    </div>
  );
}

/**
 * Tabs (DESIGN-SYSTEM §3.9): underline style, roving tabindex, ←→ + Home/End,
 * aria-selected/aria-controls, focusable panel.
 */
import { useId, useRef, type JSX, type KeyboardEvent, type ReactNode } from 'react';
import './Tabs.css';

export interface TabDef {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
  /** Accessible name for the tablist. */
  label: string;
  children?: ReactNode;
  className?: string;
}

export function Tabs({ tabs, active, onChange, label, children, className }: TabsProps): JSX.Element {
  const baseId = useId();
  const refs = useRef(new Map<string, HTMLButtonElement>());

  const focusAndSelect = (index: number): void => {
    const tab = tabs[index];
    if (tab === undefined) return;
    refs.current.get(tab.id)?.focus();
    onChange(tab.id);
  };

  const onKeyDown = (e: KeyboardEvent, index: number): void => {
    const last = tabs.length - 1;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAndSelect(index === last ? 0 : index + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAndSelect(index === 0 ? last : index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusAndSelect(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusAndSelect(last);
    }
  };

  return (
    <div className={['kb-tabs', className ?? ''].filter(Boolean).join(' ')}>
      <div role="tablist" aria-label={label} className="kb-tabs__list">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el !== null) refs.current.set(tab.id, el);
              else refs.current.delete(tab.id);
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab.id}`}
            aria-selected={tab.id === active}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={tab.id === active ? 0 : -1}
            className={`kb-tabs__tab${tab.id === active ? ' kb-tabs__tab--active' : ''}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {tab.label}
            {tab.count !== undefined && <span className="kb-tabs__count">({tab.count})</span>}
          </button>
        ))}
      </div>
      <div
        key={active}
        role="tabpanel"
        id={`${baseId}-panel-${active}`}
        aria-labelledby={`${baseId}-tab-${active}`}
        tabIndex={-1}
        className="kb-tabs__panel kb-tabs__panel--enter"
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Diff viewer primitives (DESIGN-SYSTEM §3.14) — the trust-critical surface
 * behind Import → Review changes (matrix improvement #1: never silent
 * overwrite). Old value: danger bg + strikethrough (strike + color, never
 * color alone). New value: accent bg. Conflicts: amber, radio choice per
 * field, NOTHING preselected. Sticky footer always says "Nothing has been
 * saved yet." with the live change count on the primary.
 */
import { useId, type JSX, type ReactNode } from 'react';
import { Button } from './Button';
import './Diff.css';

/* ── Summary chips ───────────────────────────────────────────────────────── */

export interface DiffCounts {
  added: number;
  changed: number;
  conflicts: number;
  notInFile: number;
}

export type DiffGroup = keyof DiffCounts;

export interface DiffSummaryChipsProps {
  counts: DiffCounts;
  active: ReadonlySet<DiffGroup>;
  onToggle: (group: DiffGroup) => void;
}

const GROUP_LABELS: Record<DiffGroup, { label: string; variant: string }> = {
  added: { label: 'new', variant: 'green' },
  changed: { label: 'changed', variant: 'blue' },
  conflicts: { label: 'conflicts', variant: 'amber' },
  notInFile: { label: 'not in file', variant: 'neutral' },
};

export function DiffSummaryChips({ counts, active, onToggle }: DiffSummaryChipsProps): JSX.Element {
  return (
    <div className="kb-diff__summary">
      {(Object.keys(GROUP_LABELS) as DiffGroup[]).map((group) => (
        <button
          key={group}
          type="button"
          aria-pressed={active.has(group)}
          className={`kb-diff__chip kb-diff__chip--${GROUP_LABELS[group].variant}${
            active.has(group) ? ' kb-diff__chip--active' : ''
          }`}
          onClick={() => onToggle(group)}
        >
          {counts[group]} {GROUP_LABELS[group].label}
        </button>
      ))}
    </div>
  );
}

/* ── Changed-field row ───────────────────────────────────────────────────── */

export interface DiffFieldRowProps {
  fieldLabel: string;
  oldValue: string;
  newValue: string;
}

export function DiffFieldRow({ fieldLabel, oldValue, newValue }: DiffFieldRowProps): JSX.Element {
  return (
    <div className="kb-diff__fieldrow">
      <span className="kb-diff__fieldlabel">{fieldLabel}</span>
      <span className="kb-diff__old">{oldValue}</span>
      <span className="kb-diff__arrow" aria-hidden="true">
        →
      </span>
      <span className="kb-diff__new">{newValue}</span>
      <span className="kb-visually-hidden">
        {fieldLabel} changes from {oldValue} to {newValue}
      </span>
    </div>
  );
}

/* ── Conflict row: radio choice per field, nothing preselected ───────────── */

export interface ConflictFieldProps {
  fieldLabel: string;
  currentValue: string;
  incomingValue: string;
  resolution: 'keep_existing' | 'use_incoming' | null;
  onResolve: (r: 'keep_existing' | 'use_incoming') => void;
}

export function ConflictField({
  fieldLabel,
  currentValue,
  incomingValue,
  resolution,
  onResolve,
}: ConflictFieldProps): JSX.Element {
  const name = useId();
  return (
    <fieldset className="kb-diff__conflict">
      <legend className="kb-diff__fieldlabel">{fieldLabel}</legend>
      <label className="kb-diff__choice">
        <input
          type="radio"
          name={name}
          checked={resolution === 'keep_existing'}
          onChange={() => onResolve('keep_existing')}
        />
        Keep current ({currentValue})
      </label>
      <label className="kb-diff__choice">
        <input
          type="radio"
          name={name}
          checked={resolution === 'use_incoming'}
          onChange={() => onResolve('use_incoming')}
        />
        Take file ({incomingValue})
      </label>
    </fieldset>
  );
}

/* ── Record group wrapper ────────────────────────────────────────────────── */

export function DiffRecord({
  title,
  kind,
  children,
}: {
  title: string;
  kind: 'added' | 'changed' | 'conflicts' | 'notInFile';
  children?: ReactNode;
}): JSX.Element {
  return (
    <section className={`kb-diff__record kb-diff__record--${kind}`} aria-label={title}>
      <h3 className="kb-diff__recordtitle">{title}</h3>
      {children}
    </section>
  );
}

/* ── Sticky footer ───────────────────────────────────────────────────────── */

export interface DiffFooterProps {
  /** Live count for the primary: "Apply 153 changes". */
  applyLabel: string;
  onApply: () => void;
  onCancel: () => void;
  /** Disable apply until every conflict is resolved; say why. */
  applyDisabledReason?: string;
  working?: string;
}

export function DiffFooter({
  applyLabel,
  onApply,
  onCancel,
  applyDisabledReason,
  working,
}: DiffFooterProps): JSX.Element {
  return (
    <div className="kb-diff__footer">
      <span className="kb-diff__footernote">Nothing has been saved yet.</span>
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={onApply}
        disabled={applyDisabledReason !== undefined}
        disabledReason={applyDisabledReason}
        working={working}
      >
        {applyLabel}
      </Button>
    </div>
  );
}

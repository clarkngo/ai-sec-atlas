import { useEffect, useRef, useState } from 'react';
import type { AtlasData, AtlasNode, LayoutDirection, Severity } from '../types';
import type { View } from '../lib/urlState';
import { isMuted, onMuteChange, play, setMuted } from '../lib/sound';
import { SearchBox } from './SearchBox';

interface Props {
  data: AtlasData;
  view: View;
  onView: (v: View) => void;
  domain: string | 'ALL';
  onDomain: (d: string | 'ALL') => void;
  severity: Severity | 'ALL';
  onSeverity: (s: Severity | 'ALL') => void;
  direction: LayoutDirection;
  onDirection: (d: LayoutDirection) => void;
  query: string;
  onQuery: (q: string) => void;
  results: AtlasNode[];
  onPick: (id: string) => void;
  onFit: () => void;
  onReset: () => void;
  onAbout: () => void;
  onGuide: () => void;
  metrics: { critical: number; high: number; total: number };
}

const selectCls =
  'max-w-[11rem] rounded-md border border-[var(--atlas-border)] bg-[var(--atlas-surface)] px-2 py-1.5 text-xs text-[var(--atlas-text)] focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)] sm:max-w-none';

const btnCls =
  'rounded-md border border-[var(--atlas-border)] bg-[var(--atlas-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--atlas-muted)] hover:border-[var(--atlas-accent)]/40 hover:text-[var(--atlas-text)] focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]';

const VIEWS: { id: View; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'map', label: 'Map' },
  { id: 'list', label: 'List' },
];

function SoundToggle() {
  const [muted, setM] = useState(isMuted);
  useEffect(() => onMuteChange(setM), []);
  return (
    <button
      type="button"
      className={btnCls}
      aria-pressed={!muted}
      title={muted ? 'Turn sound effects on' : 'Turn sound effects off'}
      onClick={() => {
        setMuted(!muted);
        if (muted) play('toggle');
      }}
    >
      <span className="sr-only">Sound effects</span>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 9h4l5-4v14l-5-4H4z" strokeLinejoin="round" />
        {muted ? <path d="M17 9l5 6m0-6l-5 6" strokeLinecap="round" /> : <path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" strokeLinecap="round" />}
      </svg>
    </button>
  );
}

function ViewOptions({
  direction,
  onDirection,
  onFit,
}: {
  direction: LayoutDirection;
  onDirection: (d: LayoutDirection) => void;
  onFit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" className={btnCls} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        Layout
      </button>
      {open && (
        <div className="absolute top-full right-0 z-40 mt-1 w-48 rounded-lg border border-[var(--atlas-border)] bg-[var(--atlas-panel)] p-2 shadow-2xl">
          <p className="mb-1 px-1 font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase">Direction</p>
          <div role="group" aria-label="Layout direction" className="mb-2 flex rounded-md border border-[var(--atlas-border)] p-0.5">
            {(['TB', 'LR'] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={direction === d}
                onClick={() => onDirection(d)}
                className={`flex-1 rounded px-2 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)] ${
                  direction === d ? 'bg-[var(--atlas-accent)]/20 text-[var(--atlas-accent)]' : 'text-[var(--atlas-muted)] hover:text-[var(--atlas-text)]'
                }`}
              >
                {d === 'TB' ? 'Top-down' : 'Left-right'}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`${btnCls} w-full`}
            onClick={() => {
              onFit();
              setOpen(false);
            }}
          >
            Fit to screen
          </button>
        </div>
      )}
    </div>
  );
}

export function Header(p: Props) {
  const { data, view } = p;
  const filtering = view !== 'overview';
  const filtered = p.domain !== 'ALL' || p.severity !== 'ALL' || p.query.trim() !== '';

  return (
    <header className="relative z-[45] flex flex-col gap-2 border-b border-[var(--atlas-border)] bg-[var(--atlas-surface)]/90 px-3 py-2 backdrop-blur-md sm:px-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => p.onView('overview')}
          className="mr-1 flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]"
          aria-label={`${data.meta.name}: go to overview`}
        >
          <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden>
            <rect width="32" height="32" rx="4" fill="#070b14" />
            <path d="M16 4L26 10v8c0 6-4.5 10-10 12C10 28 6 24 6 18v-8L16 4z" fill="none" stroke="#2dd4bf" strokeWidth="2" />
            <path d="M12 16l3 3 5-6" fill="none" stroke="#f5a524" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            <span className="block text-sm font-semibold tracking-tight text-[var(--atlas-text)] sm:text-base">
              {data.meta.name}
            </span>
            <span className="hidden font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase sm:block">
              Threat → Vulnerability → Guardrail · independent, not MITRE ATLAS
            </span>
          </span>
        </button>

        <SearchBox query={p.query} onQuery={p.onQuery} results={p.results} onPick={p.onPick} />

        <div className="ml-auto hidden items-center gap-2 font-mono text-[10px] tracking-wide sm:flex">
          <span
            className="rounded border border-[var(--atlas-critical)]/40 bg-[var(--atlas-critical)]/10 px-2 py-1 text-[var(--atlas-critical)]"
            title="Critical threats and vulnerabilities in view"
          >
            CRIT {p.metrics.critical}
          </span>
          <span
            className="rounded border border-[var(--atlas-high)]/40 bg-[var(--atlas-high)]/10 px-2 py-1 text-[var(--atlas-high)]"
            title="High-severity threats and vulnerabilities in view"
          >
            HIGH {p.metrics.high}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="View" className="flex rounded-md border border-[var(--atlas-border)] p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              onClick={() => p.onView(v.id)}
              className={`rounded px-2.5 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)] ${
                view === v.id ? 'bg-[var(--atlas-accent)]/20 text-[var(--atlas-accent)]' : 'text-[var(--atlas-muted)] hover:text-[var(--atlas-text)]'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {filtering && (
          <>
            <label className="flex items-center gap-1.5">
              <span className="sr-only">Area</span>
              <select
                className={selectCls}
                value={p.domain}
                onChange={(e) => p.onDomain(e.target.value as string | 'ALL')}
                aria-label="Filter by area"
              >
                <option value="ALL">All areas</option>
                {data.domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5">
              <span className="sr-only">Severity</span>
              <select
                className={selectCls}
                value={p.severity}
                onChange={(e) => p.onSeverity(e.target.value as Severity | 'ALL')}
                aria-label="Filter by severity"
              >
                <option value="ALL">All severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </label>

            {filtered && (
              <button type="button" className={btnCls} onClick={p.onReset}>
                Clear filters
              </button>
            )}
          </>
        )}

        <div className="ml-auto flex gap-1.5">
          {view === 'map' && <ViewOptions direction={p.direction} onDirection={p.onDirection} onFit={p.onFit} />}
          <button type="button" className={btnCls} onClick={p.onGuide}>
            How to read
          </button>
          <button type="button" className={btnCls} onClick={p.onAbout}>
            About &amp; sources
          </button>
          <SoundToggle />
        </div>
      </div>
    </header>
  );
}

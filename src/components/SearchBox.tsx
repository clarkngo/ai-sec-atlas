import { useEffect, useId, useRef, useState } from 'react';
import type { AtlasNode } from '../types';
import { KIND_ICON_PATH } from '../lib/theme';
import { SeverityBadge } from './SeverityBadge';

interface Props {
  query: string;
  onQuery: (q: string) => void;
  results: AtlasNode[];
  onPick: (id: string) => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const MAX = 8;

const ACCENT = {
  threat: 'var(--atlas-threat)',
  vulnerability: 'var(--atlas-vuln)',
  guardrail: 'var(--atlas-guard)',
} as const;

export function SearchBox({ query, onQuery, results, onPick }: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = results.slice(0, MAX);
  const expanded = open && query.trim().length > 0;

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pick = (id: string) => {
    onPick(id);
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, shown.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && shown[active]) {
      e.preventDefault();
      pick(shown[active].id);
    } else if (e.key === 'Escape') {
      if (query) onQuery('');
      setOpen(false);
    }
  };

  return (
    <div className="relative min-w-0 flex-1 sm:max-w-md">
      <label className="relative block">
        <span className="sr-only">Search threats, vulnerabilities, guardrails, and framework IDs</span>
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[var(--atlas-muted)]"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M8.5 3a5.5 5.5 0 014.38 8.83l3.65 3.64-1.06 1.06-3.64-3.65A5.5 5.5 0 118.5 3zm0 1.5a4 4 0 100 8 4 4 0 000-8z"
          />
        </svg>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded && shown[active] ? `${listId}-${shown[active].id}` : undefined}
          value={query}
          onChange={(e) => {
            onQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="Search a risk, fix, or ID (e.g. LLM01)"
          className="w-full rounded-md border border-[var(--atlas-border)] bg-[var(--atlas-bg)] py-1.5 pr-3 pl-8 text-sm text-[var(--atlas-text)] placeholder:text-[var(--atlas-muted)] focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-[var(--atlas-border)] px-1 font-mono text-[10px] text-[var(--atlas-muted)] sm:inline">
          {isMac ? '⌘K' : 'Ctrl K'}
        </kbd>
      </label>

      {expanded && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-40 mt-1 max-h-[60vh] overflow-y-auto rounded-lg border border-[var(--atlas-border)] bg-[var(--atlas-panel)] py-1 shadow-2xl sm:min-w-[24rem]"
        >
          {shown.length === 0 && <li className="px-3 py-2 text-xs text-[var(--atlas-muted)]">No matches</li>}
          {shown.map((n, i) => (
            <li
              key={n.id}
              id={`${listId}-${n.id}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(n.id)}
              className={`flex cursor-pointer items-start gap-2.5 px-3 py-2 ${i === active ? 'bg-[var(--atlas-accent)]/10' : ''}`}
            >
              <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke={ACCENT[n.type]} strokeWidth="2" aria-hidden>
                <path d={KIND_ICON_PATH[n.type]} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-[var(--atlas-text)]">{n.title}</span>
                <span className="block truncate font-mono text-[10px] text-[var(--atlas-muted)]">{n.domain}</span>
              </span>
              <SeverityBadge node={n} />
            </li>
          ))}
          {results.length > MAX && (
            <li className="px-3 py-1.5 font-mono text-[10px] text-[var(--atlas-muted)]">
              +{results.length - MAX} more highlighted on the map / list
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

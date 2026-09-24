import type { AtlasData, LayoutDirection, Severity } from '../types';

interface Props {
  data: AtlasData;
  domain: string | 'ALL';
  onDomain: (d: string | 'ALL') => void;
  severity: Severity | 'ALL';
  onSeverity: (s: Severity | 'ALL') => void;
  direction: LayoutDirection;
  onDirection: (d: LayoutDirection) => void;
  query: string;
  onQuery: (q: string) => void;
  onFit: () => void;
  onReset: () => void;
  metrics: { critical: number; high: number; total: number };
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

const selectCls =
  'rounded-md border border-[var(--atlas-border)] bg-[var(--atlas-surface)] px-2 py-1.5 text-xs text-[var(--atlas-text)] focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]';

const btnCls =
  'rounded-md border border-[var(--atlas-border)] bg-[var(--atlas-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--atlas-muted)] hover:border-[var(--atlas-accent)]/40 hover:text-[var(--atlas-text)] focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]';

export function Header({
  data,
  domain,
  onDomain,
  severity,
  onSeverity,
  direction,
  onDirection,
  query,
  onQuery,
  onFit,
  onReset,
  metrics,
}: Props) {
  return (
    <header className="z-20 flex flex-col gap-2 border-b border-[var(--atlas-border)] bg-[var(--atlas-surface)]/90 px-3 py-2 backdrop-blur-md sm:px-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="mr-1 flex items-center gap-2.5">
          <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden>
            <rect width="32" height="32" rx="4" fill="#070b14" />
            <path
              d="M16 4L26 10v8c0 6-4.5 10-10 12C10 28 6 24 6 18v-8L16 4z"
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="2"
            />
            <path
              d="M12 16l3 3 5-6"
              fill="none"
              stroke="#f5a524"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[var(--atlas-text)] sm:text-base">
              AI Security Atlas
            </h1>
            <p className="hidden font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase sm:block">
              Threat → Vulnerability → Guardrail
            </p>
          </div>
        </div>

        <label className="relative min-w-0 flex-1 sm:max-w-sm">
          <span className="sr-only">Search threats, vulnerabilities, guardrails</span>
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
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search vectors, OWASP, MITRE ATLAS…"
            className="w-full rounded-md border border-[var(--atlas-border)] bg-[var(--atlas-bg)] py-1.5 pr-3 pl-8 text-sm text-[var(--atlas-text)] placeholder:text-[var(--atlas-muted)] focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-[var(--atlas-border)] px-1 font-mono text-[10px] text-[var(--atlas-muted)] sm:inline">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </label>

        <div className="ml-auto flex items-center gap-2 font-mono text-[10px] tracking-wide">
          <span className="rounded border border-[var(--atlas-critical)]/40 bg-[var(--atlas-critical)]/10 px-2 py-1 text-[var(--atlas-critical)]">
            CRIT {metrics.critical}
          </span>
          <span className="rounded border border-[var(--atlas-high)]/40 bg-[var(--atlas-high)]/10 px-2 py-1 text-[var(--atlas-high)]">
            HIGH {metrics.high}
          </span>
          <span className="hidden rounded border border-[var(--atlas-border)] px-2 py-1 text-[var(--atlas-muted)] sm:inline">
            NODES {metrics.total}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase">Domain</span>
          <select
            className={selectCls}
            value={domain}
            onChange={(e) => onDomain(e.target.value as string | 'ALL')}
            aria-label="Filter by security domain"
          >
            <option value="ALL">All domains</option>
            {data.domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase">Severity</span>
          <select
            className={selectCls}
            value={severity}
            onChange={(e) => onSeverity(e.target.value as Severity | 'ALL')}
            aria-label="Filter by risk severity"
          >
            <option value="ALL">All levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </label>

        <div role="group" aria-label="Layout direction" className="flex rounded-md border border-[var(--atlas-border)] p-0.5">
          {(['TB', 'LR'] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={direction === d}
              onClick={() => onDirection(d)}
              className={`rounded px-2 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)] ${
                direction === d
                  ? 'bg-[var(--atlas-accent)]/20 text-[var(--atlas-accent)]'
                  : 'text-[var(--atlas-muted)] hover:text-[var(--atlas-text)]'
              }`}
            >
              {d === 'TB' ? 'Top-Down' : 'Left-Right'}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-1.5">
          <button type="button" className={btnCls} onClick={onFit}>
            Fit view
          </button>
          <button type="button" className={btnCls} onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}

import { RELATION_LABEL } from '../lib/theme';

export function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[min(100%,20rem)] rounded-lg border border-[var(--atlas-border)] bg-[var(--atlas-panel)]/95 px-3 py-2 text-[11px] shadow-lg backdrop-blur">
      <div className="mb-1.5 font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase">Legend</div>
      <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 text-[var(--atlas-threat)]">
          <span className="h-2.5 w-2.5 clip-threat bg-[var(--atlas-threat)]" aria-hidden />
          Threat
        </span>
        <span className="inline-flex items-center gap-1.5 text-[var(--atlas-vuln)]">
          <span className="h-2.5 w-2.5 border border-dashed border-[var(--atlas-vuln)]" aria-hidden />
          Vulnerability
        </span>
        <span className="inline-flex items-center gap-1.5 text-[var(--atlas-guard)]">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-[var(--atlas-guard)]" aria-hidden />
          Guardrail
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-[var(--atlas-muted)]">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-4 border-t border-dashed border-[var(--atlas-vuln)]" aria-hidden />
          {RELATION_LABEL.EXPLOITS}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-4 border-t-2 border-[var(--atlas-guard)]" aria-hidden />
          {RELATION_LABEL.MITIGATES}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-4 border-t border-dotted border-[var(--atlas-accent)]" aria-hidden />
          {RELATION_LABEL.REQUIRES}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-4 border-t border-[var(--atlas-threat)]" aria-hidden />
          {RELATION_LABEL.LEADS_TO}
        </span>
      </div>
    </div>
  );
}

export function StatusBar({
  visible,
  total,
  selectedTitle,
}: {
  visible: number;
  total: number;
  selectedTitle: string | null;
}) {
  return (
    <div className="absolute right-3 bottom-3 z-10 flex flex-col items-end gap-1.5">
      <div className="hidden rounded-md border border-[var(--atlas-border)] bg-[var(--atlas-panel)]/95 px-2.5 py-1.5 font-mono text-[10px] text-[var(--atlas-muted)] backdrop-blur sm:block">
        {visible}/{total} nodes
        {selectedTitle ? ` · ${selectedTitle}` : ' · click a node for detail'}
      </div>
      <p className="rounded-md border border-[var(--atlas-border)] bg-[var(--atlas-panel)]/95 px-2.5 py-1.5 font-mono text-[10px] text-[var(--atlas-muted)] backdrop-blur">
        built by{' '}
        <a
          href="https://www.linkedin.com/in/clarkngo/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--atlas-accent)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]"
        >
          Clark Ngo
        </a>
      </p>
    </div>
  );
}

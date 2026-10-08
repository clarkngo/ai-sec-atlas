import { useEffect, useState } from 'react';
import type { AtlasData, AtlasNode, NodeKind } from '../types';
import { KIND_ICON_PATH, KIND_LABEL, SEVERITY_LABEL } from '../lib/theme';
import { buildChecklist, copyText } from '../lib/checklist';
import { play } from '../lib/sound';
import { SeverityBadge } from './SeverityBadge';

interface Props {
  data: AtlasData;
  nodes: AtlasNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
const KINDS: NodeKind[] = ['threat', 'vulnerability', 'guardrail'];
const KIND_PLURAL: Record<NodeKind, string> = {
  threat: 'Threats',
  vulnerability: 'Vulnerabilities',
  guardrail: 'Guardrails',
};
const ACCENT: Record<NodeKind, string> = {
  threat: 'var(--atlas-threat)',
  vulnerability: 'var(--atlas-vuln)',
  guardrail: 'var(--atlas-guard)',
};

export function ListView({ data, nodes, selectedId, onSelect }: Props) {
  const [copied, setCopied] = useState<{ domain: string; ok: boolean } | null>(null);
  const domains = data.domains.filter((d) => nodes.some((n) => n.domain === d));

  // Bring the selected entry into view (deep links, search picks, Related links).
  useEffect(() => {
    if (!selectedId) return;
    const el = document.querySelector(`[data-node="${selectedId}"]`);
    el?.scrollIntoView({
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }, [selectedId]);

  const copyDomain = async (domain: string) => {
    const guardrails = data.nodes.filter((n) => n.domain === domain && n.type === 'guardrail');
    const ok = await copyText(buildChecklist(`${domain}: guardrail checklist`, guardrails, data));
    if (ok) play('success');
    setCopied({ domain, ok });
    window.setTimeout(() => setCopied((c) => (c?.domain === domain ? null : c)), 1800);
  };

  if (!domains.length) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[var(--atlas-muted)]">
        Nothing matches these filters.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-5 pb-24">
        {domains.map((d) => (
          <section key={d} aria-labelledby={`list-${d}`}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id={`list-${d}`} className="text-base font-semibold text-[var(--atlas-text)]">
                {d}
              </h2>
              <button
                type="button"
                onClick={() => copyDomain(d)}
                className="rounded-md border border-[var(--atlas-border)] px-2 py-1 text-xs text-[var(--atlas-muted)] hover:text-[var(--atlas-text)] focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]"
              >
                <span aria-live="polite">{copied?.domain === d ? (copied.ok ? 'Copied checklist' : 'Copy failed') : 'Copy guardrail checklist'}</span>
              </button>
            </div>
            <p className="mb-3 text-[13px] text-[var(--atlas-muted)]">{data.domainInfo[d]?.summary}</p>
            {KINDS.map((kind) => {
              const items = nodes
                .filter((n) => n.domain === d && n.type === kind)
                .sort((a, b) => RANK[a.severity] - RANK[b.severity]);
              if (!items.length) return null;
              return (
                <div key={kind} className="mb-4">
                  <h3
                    className="mb-1.5 font-mono text-[10px] tracking-wider uppercase"
                    style={{ color: ACCENT[kind] }}
                  >
                    {KIND_PLURAL[kind]}
                  </h3>
                  <ul className="divide-y divide-[var(--atlas-border)] overflow-hidden rounded-lg border border-[var(--atlas-border)] bg-[var(--atlas-panel)]">
                    {items.map((n) => (
                      <li key={n.id} data-node={n.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(n.id)}
                          aria-current={selectedId === n.id ? 'true' : undefined}
                          aria-label={`${KIND_LABEL[n.type]}: ${n.title}, ${SEVERITY_LABEL[n.severity]}`}
                          className={`flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-white/[0.03] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--atlas-accent)] ${
                            selectedId === n.id ? 'bg-[var(--atlas-accent)]/10' : ''
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="mt-0.5 h-4 w-4 shrink-0"
                            fill="none"
                            stroke={ACCENT[n.type]}
                            strokeWidth="2"
                            aria-hidden
                          >
                            <path d={KIND_ICON_PATH[n.type]} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-medium leading-snug text-[var(--atlas-text)]">
                              {n.title}
                            </span>
                            <span className="mt-0.5 block text-[12px] leading-snug text-[var(--atlas-muted)]">
                              {n.summary}
                            </span>
                          </span>
                          <SeverityBadge node={n} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}

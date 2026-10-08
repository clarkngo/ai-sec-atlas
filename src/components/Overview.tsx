import { useState } from 'react';
import type { AtlasData } from '../types';
import { buildChecklist, copyText } from '../lib/checklist';
import { play } from '../lib/sound';

interface Props {
  data: AtlasData;
  onOpenDomain: (domain: string | 'ALL', view: 'map' | 'list') => void;
  onStartPath: (pathId: string) => void;
  onGuide: () => void;
}

const btnCls =
  'rounded-md border border-[var(--atlas-border)] bg-[var(--atlas-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--atlas-muted)] hover:border-[var(--atlas-accent)]/40 hover:text-[var(--atlas-text)] focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]';

export function Overview({ data, onOpenDomain, onStartPath, onGuide }: Props) {
  const [copied, setCopied] = useState<{ domain: string; ok: boolean } | null>(null);

  const copyDomain = async (domain: string) => {
    const guardrails = data.nodes.filter((n) => n.domain === domain && n.type === 'guardrail');
    const ok = await copyText(buildChecklist(`${domain}: guardrail checklist`, guardrails, data));
    if (ok) play('success');
    setCopied({ domain, ok });
    window.setTimeout(() => setCopied((c) => (c?.domain === domain ? null : c)), 1800);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 pt-6 pb-20 sm:pt-10">
        <section className="mb-8">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--atlas-text)] sm:text-2xl">
            Find the fix for an AI security risk
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--atlas-muted)]">
            Each <span className="text-[var(--atlas-threat)]">threat</span> links to the{' '}
            <span className="text-[var(--atlas-vuln)]">vulnerability</span> it exploits and the{' '}
            <span className="text-[var(--atlas-guard)]">guardrail</span> that fixes it, with tests and sources. Pick an
            area below, follow a guided path, or search for a specific risk.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={btnCls} onClick={() => onOpenDomain('ALL', 'map')}>
              Show everything on the map
            </button>
            <button type="button" className={btnCls} onClick={() => onOpenDomain('ALL', 'list')}>
              Browse as a list
            </button>
            <button type="button" className={btnCls} onClick={onGuide}>
              How to read the map
            </button>
          </div>
        </section>

        <section aria-labelledby="areas-heading" className="mb-10">
          <h3 id="areas-heading" className="mb-3 font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase">
            Areas
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.domains.map((d) => {
              const nodes = data.nodes.filter((n) => n.domain === d);
              const threats = nodes.filter((n) => n.type === 'threat');
              const critical = nodes.filter((n) => n.type !== 'guardrail' && n.severity === 'CRITICAL').length;
              const guards = nodes.filter((n) => n.type === 'guardrail').length;
              return (
                <li
                  key={d}
                  className="flex flex-col rounded-xl border border-[var(--atlas-border)] bg-[var(--atlas-panel)] p-4 transition-colors hover:border-[var(--atlas-accent)]/40"
                >
                  <button
                    type="button"
                    // Phones get the list; the map needs room to be readable.
                    onClick={() => onOpenDomain(d, window.innerWidth < 640 ? 'list' : 'map')}
                    className="text-left focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]"
                  >
                    <span className="block text-[15px] font-semibold leading-snug text-[var(--atlas-text)]">{d}</span>
                    <span className="mt-1.5 block text-[13px] leading-relaxed text-[var(--atlas-muted)]">
                      {data.domainInfo[d]?.summary}
                    </span>
                  </button>
                  <p className="mt-3 font-mono text-[11px] text-[var(--atlas-muted)]">
                    {threats.length} threats ·{' '}
                    <span className="text-[var(--atlas-critical)]">{critical} critical risks</span> · {guards} guardrails
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--atlas-border)] pt-3">
                    <button type="button" className={btnCls} onClick={() => onOpenDomain(d, 'map')}>
                      Map
                    </button>
                    <button type="button" className={btnCls} onClick={() => onOpenDomain(d, 'list')}>
                      List
                    </button>
                    <button type="button" className={btnCls} onClick={() => copyDomain(d)}>
                      <span aria-live="polite">{copied?.domain === d ? (copied.ok ? 'Copied checklist' : 'Copy failed') : 'Copy checklist'}</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="paths-heading">
          <h3 id="paths-heading" className="mb-3 font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase">
            Guided paths
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.paths.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onStartPath(p.id)}
                  className="flex h-full w-full flex-col rounded-xl border border-[var(--atlas-guard)]/30 bg-[var(--atlas-guard)]/5 p-4 text-left transition-colors hover:border-[var(--atlas-guard)]/60 focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]"
                >
                  <span className="text-[15px] font-semibold leading-snug text-[var(--atlas-text)]">{p.title}</span>
                  <span className="mt-1.5 text-[13px] leading-relaxed text-[var(--atlas-muted)]">{p.summary}</span>
                  <span className="mt-auto pt-3 font-mono text-[11px] text-[var(--atlas-guard)]">
                    {p.steps.length} steps · Start →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

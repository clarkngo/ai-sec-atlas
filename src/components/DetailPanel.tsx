import { useEffect, useId, useRef, useState } from 'react';
import type { AtlasData, AtlasNode, AtlasReference } from '../types';
import { KIND_ICON_PATH, KIND_LABEL, SEVERITY_LABEL, SOURCE_ORDER, SOURCE_SHORT } from '../lib/theme';

interface Props {
  node: AtlasNode;
  data: AtlasData;
  onClose: () => void;
}

const LEVEL_SHORT = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' } as const;

const linkCls =
  'text-[var(--atlas-accent)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]';

function severityColor(sev: AtlasNode['severity']) {
  switch (sev) {
    case 'CRITICAL':
      return 'var(--atlas-critical)';
    case 'HIGH':
      return 'var(--atlas-high)';
    case 'MEDIUM':
      return 'var(--atlas-medium)';
    default:
      return 'var(--atlas-low)';
  }
}

function kindAccent(type: AtlasNode['type']) {
  switch (type) {
    case 'threat':
      return 'var(--atlas-threat)';
    case 'vulnerability':
      return 'var(--atlas-vuln)';
    default:
      return 'var(--atlas-guard)';
  }
}

export function DetailPanel({ node, data, onClose }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => setCopied(false), [node.id]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const refsBySource = SOURCE_ORDER.map((source) => ({
    source,
    refs: node.frameworks
      .map((key) => data.references[key])
      .filter((r): r is AtlasReference => r?.source === source),
  })).filter((g) => g.refs.length > 0);

  const mitigated =
    node.type === 'guardrail'
      ? data.edges
          .filter((e) => e.source === node.id && e.relation === 'MITIGATES')
          .map((e) => data.nodes.find((n) => n.id === e.target))
          .filter((n): n is AtlasNode => !!n)
      : [];
  const method = data.meta.severityMethod;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [node.id, onClose]);

  const accent = kindAccent(node.type);

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-30 bg-black/50 md:hidden"
        aria-label="Close detail panel"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-x-0 bottom-0 z-40 flex max-h-[78vh] flex-col overflow-hidden rounded-t-2xl border border-[var(--atlas-border)] bg-[var(--atlas-panel)] shadow-2xl sheet-enter md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[min(100%,26rem)] md:rounded-none md:border-y-0 md:border-r-0 md:panel-enter"
      >
        <div className="flex items-start gap-3 border-b border-[var(--atlas-border)] px-4 py-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
            style={{ borderColor: accent, color: accent }}
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={KIND_ICON_PATH[node.type]} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: accent }}>
                {KIND_LABEL[node.type]}
              </span>
              <span
                className="rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium"
                style={{
                  color: severityColor(node.severity),
                  borderColor: `${severityColor(node.severity)}66`,
                  background: `${severityColor(node.severity)}18`,
                }}
              >
                {node.type === 'guardrail' ? `Addresses ${SEVERITY_LABEL[node.severity]}` : SEVERITY_LABEL[node.severity]}
              </span>
            </div>
            <h2 id={titleId} className="mt-1 text-base font-semibold leading-snug text-[var(--atlas-text)]">
              {node.title}
            </h2>
            <p className="mt-0.5 font-mono text-[10px] text-[var(--atlas-muted)]">{node.domain}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--atlas-border)] px-2 py-1 text-xs text-[var(--atlas-muted)] hover:text-[var(--atlas-text)] focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="rounded-md border border-[var(--atlas-border)] px-2 py-1 text-xs text-[var(--atlas-muted)] hover:text-[var(--atlas-text)] focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]"
            >
              <span aria-live="polite">{copied ? 'Copied' : 'Copy link'}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 text-sm">
          <section>
            <h3 className="mb-1 font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase">Summary</h3>
            <p className="leading-relaxed text-[var(--atlas-text)]/90">{node.summary}</p>
          </section>

          <section>
            <h3 className="mb-1 font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase">Impact</h3>
            <p className="leading-relaxed text-[var(--atlas-text)]/90">{node.impact}</p>
          </section>

          <section>
            <h3 className="mb-1 font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase">
              Why this severity
            </h3>
            {node.risk ? (
              <>
                <p className="font-mono text-[11px] text-[var(--atlas-text)]">
                  Impact {LEVEL_SHORT[node.risk.impact]} × Likelihood {LEVEL_SHORT[node.risk.likelihood]} ={' '}
                  <span style={{ color: severityColor(node.severity) }}>{SEVERITY_LABEL[node.severity]}</span>
                </p>
                <p className="mt-1 leading-relaxed text-[var(--atlas-text)]/90">{node.risk.rationale}</p>
              </>
            ) : (
              <p className="leading-relaxed text-[var(--atlas-text)]/90">
                Guardrails inherit the highest severity of the risks they mitigate:{' '}
                {mitigated.map((m, i) => (
                  <span key={m.id}>
                    {i > 0 && ', '}
                    {m.title} ({SEVERITY_LABEL[m.severity]})
                  </span>
                ))}
                .
              </p>
            )}
            <p className="mt-1 text-[11px] text-[var(--atlas-muted)]">
              Method:{' '}
              <a href={method.url} target="_blank" rel="noopener noreferrer" className={linkCls}>
                {method.name}
              </a>
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase">
              Framework mapping
            </h3>
            <div className="space-y-2.5">
              {refsBySource.map(({ source, refs }) => (
                <div key={source}>
                  <p className="mb-1 text-[11px] font-medium text-[var(--atlas-muted)]">{SOURCE_SHORT[source]}</p>
                  <ul className="space-y-1">
                    {refs.map((r) => (
                      <li key={r.code} className="flex gap-2 text-[12px] leading-snug">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`shrink-0 font-mono ${linkCls}`}
                        >
                          {r.code}
                        </a>
                        <span className="text-[var(--atlas-text)]/90">{r.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase">
              Remediation
            </h3>
            <ol className="list-decimal space-y-2 pl-4 text-[var(--atlas-text)]/90">
              {node.remediation.map((step) => (
                <li key={step} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </section>

          {node.verification && node.verification.length > 0 && (
            <section>
              <h3 className="mb-2 font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase">
                Verification
              </h3>
              <ul className="list-disc space-y-2 pl-4 text-[var(--atlas-text)]/90">
                {node.verification.map((v) => (
                  <li key={v} className="leading-relaxed">
                    {v}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {node.codeExample && (
            <section>
              <h3 className="mb-2 font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase">
                Pattern snippet
              </h3>
              <pre className="overflow-x-auto rounded-lg border border-[var(--atlas-border)] bg-[var(--atlas-bg)] p-3 font-mono text-[11px] leading-relaxed text-[var(--atlas-guard)]">
                <code>{node.codeExample}</code>
              </pre>
            </section>
          )}
        </div>
      </aside>
    </>
  );
}

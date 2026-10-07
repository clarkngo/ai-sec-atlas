import { useEffect, useId, useRef } from 'react';
import type { AtlasData } from '../types';

interface Props {
  data: AtlasData;
  onClose: () => void;
}

const linkCls =
  'text-[var(--atlas-accent)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]';

const h3Cls = 'mb-1.5 font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase';

// OWASP Risk Rating overall-severity matrix: rows = impact, columns = likelihood.
const MATRIX: [string, string[]][] = [
  ['High', ['Medium', 'High', 'Critical']],
  ['Medium', ['Low', 'Medium', 'High']],
  ['Low', ['Low', 'Low', 'Medium']],
];

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>
      {children}
    </a>
  );
}

export function AboutDialog({ data, onClose }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const { meta } = data;
  const repo = meta.repository;
  const datasetUrl = `${import.meta.env.BASE_URL}data/seed-data.json`;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const counts = {
    threat: data.nodes.filter((n) => n.type === 'threat').length,
    vulnerability: data.nodes.filter((n) => n.type === 'vulnerability').length,
    guardrail: data.nodes.filter((n) => n.type === 'guardrail').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[var(--atlas-border)] bg-[var(--atlas-panel)] shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--atlas-border)] px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-[var(--atlas-text)]">
              About {meta.name}
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-[var(--atlas-muted)]">
              App v{__APP_VERSION__} · Dataset v{meta.datasetVersion} · updated {meta.updated} · {meta.license} License
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--atlas-border)] px-2 py-1 text-xs text-[var(--atlas-muted)] hover:text-[var(--atlas-text)] focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-[var(--atlas-text)]/90">
          <section>
            <p>
              {meta.name} is an open, interactive threat model for AI agents, LLM applications, and RAG systems. Each
              entry links an adversarial <em>threat</em> to the <em>vulnerabilities</em> it exploits and to concrete{' '}
              <em>guardrails</em>, with remediation steps, verification tests, and code patterns. It currently covers{' '}
              {data.domains.length} domains: {counts.threat} threats, {counts.vulnerability} vulnerabilities, and{' '}
              {counts.guardrail} guardrails.
            </p>
          </section>

          <section className="rounded-lg border border-[var(--atlas-border)] bg-[var(--atlas-bg)] p-3">
            <h3 className={h3Cls}>Not MITRE ATLAS</h3>
            <p>
              This is an independent project and is not affiliated with or endorsed by MITRE.{' '}
              <Ext href="https://atlas.mitre.org/">MITRE ATLAS</Ext> is MITRE's knowledge base of adversary tactics,
              techniques, and case studies against AI systems, written from the attacker's point of view. This project
              is written for defenders: it starts from a risk, follows it to the weakness it exploits, and ends at the
              control that fixes it, with tests that confirm the fix works. It cites ATLAS technique and mitigation IDs as
              references; it does not extend or replace them.
            </p>
          </section>

          <section>
            <h3 className={h3Cls}>Sources</h3>
            <p className="mb-2">
              Every entry is mapped to at least one external framework. Each ID in a detail panel links to its
              official page.
            </p>
            <ul className="space-y-1">
              {data.sources.map((s) => (
                <li key={s.id}>
                  <Ext href={s.url}>{s.name}</Ext> <span className="text-[var(--atlas-muted)]">({s.version})</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className={h3Cls}>How severity is assigned</h3>
            <p className="mb-2">
              Severity follows the <Ext href={meta.severityMethod.url}>{meta.severityMethod.name}</Ext>. Each threat
              and vulnerability is rated High, Medium, or Low for impact and for likelihood, with a written rationale
              shown in its detail panel. The overall rating is read from the matrix below. A guardrail is labeled with
              the highest severity among the risks it directly mitigates. These ratings are the author's assessment
              for a typical production deployment and should be re-scored for your own environment.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full max-w-sm border-collapse font-mono text-[11px]">
                <caption className="sr-only">Overall severity by impact (rows) and likelihood (columns)</caption>
                <thead>
                  <tr className="text-[var(--atlas-muted)]">
                    <th className="p-1.5 text-left font-normal">Impact ↓ / Likelihood →</th>
                    <th className="p-1.5 font-normal">Low</th>
                    <th className="p-1.5 font-normal">Medium</th>
                    <th className="p-1.5 font-normal">High</th>
                  </tr>
                </thead>
                <tbody>
                  {MATRIX.map(([impact, row]) => (
                    <tr key={impact} className="border-t border-[var(--atlas-border)]">
                      <th className="p-1.5 text-left font-normal text-[var(--atlas-muted)]">{impact}</th>
                      {row.map((cell, i) => (
                        <td key={i} className="p-1.5 text-center">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className={h3Cls}>Use, cite, contribute</h3>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                Source code and data: <Ext href={repo}>{repo.replace('https://', '')}</Ext> ({meta.license} License)
              </li>
              <li>
                Machine-readable dataset: <Ext href={datasetUrl}>seed-data.json</Ext>
              </li>
              <li>
                Link to any entry with <span className="font-mono text-[12px]">Copy link</span> in its detail panel.
              </li>
              <li>
                Cite it with <Ext href={`${repo}/blob/main/CITATION.cff`}>CITATION.cff</Ext> (also shown as "Cite this
                repository" on GitHub).
              </li>
              <li>
                <Ext href={`${repo}/issues/new/choose`}>Suggest an entry or report a mapping error</Ext>
              </li>
            </ul>
          </section>

          <p className="text-[12px] text-[var(--atlas-muted)]">
            Built and maintained by <Ext href="https://www.linkedin.com/in/clarkngo/">Clark Ngo</Ext>.
          </p>
        </div>
      </div>
    </div>
  );
}

import type { AtlasNode } from '../types';
import { SEVERITY_LABEL } from '../lib/theme';

const CLS: Record<AtlasNode['severity'], string> = {
  CRITICAL: 'text-[var(--atlas-critical)] border-[var(--atlas-critical)]/40 bg-[var(--atlas-critical)]/10',
  HIGH: 'text-[var(--atlas-high)] border-[var(--atlas-high)]/40 bg-[var(--atlas-high)]/10',
  MEDIUM: 'text-[var(--atlas-medium)] border-[var(--atlas-medium)]/40 bg-[var(--atlas-medium)]/10',
  LOW: 'text-[var(--atlas-low)] border-[var(--atlas-low)]/40 bg-[var(--atlas-low)]/10',
};

/** Risks show their own severity; guardrails show the most severe risk they fix. */
export function severityText(node: AtlasNode) {
  const label = SEVERITY_LABEL[node.severity];
  return node.type === 'guardrail' ? `Fixes ${label.toLowerCase()}` : label;
}

export function SeverityBadge({ node, className = '' }: { node: AtlasNode; className?: string }) {
  return (
    <span
      className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide whitespace-nowrap ${CLS[node.severity]} ${className}`}
      title={node.type === 'guardrail' ? 'Most severe risk this guardrail mitigates' : 'Impact × likelihood (OWASP Risk Rating)'}
    >
      {severityText(node)}
    </span>
  );
}

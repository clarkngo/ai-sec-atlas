import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { AtlasNode, LayoutDirection } from '../../types';
import { KIND_ICON_PATH, KIND_LABEL, KIND_SHORT, SEVERITY_LABEL } from '../../lib/theme';

export type SecFlowNode = Node<
  {
    atlas: AtlasNode;
    selected: boolean;
    dimmed: boolean;
    direction: LayoutDirection;
  },
  'threat' | 'vulnerability' | 'guardrail'
>;

function severityClass(sev: AtlasNode['severity']) {
  switch (sev) {
    case 'CRITICAL':
      return 'text-[var(--atlas-critical)] border-[var(--atlas-critical)]/40 bg-[var(--atlas-critical)]/10';
    case 'HIGH':
      return 'text-[var(--atlas-high)] border-[var(--atlas-high)]/40 bg-[var(--atlas-high)]/10';
    case 'MEDIUM':
      return 'text-[var(--atlas-medium)] border-[var(--atlas-medium)]/40 bg-[var(--atlas-medium)]/10';
    default:
      return 'text-[var(--atlas-low)] border-[var(--atlas-low)]/40 bg-[var(--atlas-low)]/10';
  }
}

function NodeShell({
  data,
  kindClass,
  accent,
  pattern,
}: {
  data: SecFlowNode['data'];
  kindClass: string;
  accent: string;
  pattern: 'slash' | 'dots' | 'solid';
}) {
  const { atlas, selected, dimmed, direction } = data;
  const targetPos = direction === 'LR' ? Position.Left : Position.Top;
  const sourcePos = direction === 'LR' ? Position.Right : Position.Bottom;
  const patternStyle =
    pattern === 'slash'
      ? {
          backgroundImage:
            'repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(245,165,36,0.06) 5px, rgba(245,165,36,0.06) 6px)',
        }
      : pattern === 'dots'
        ? {
            backgroundImage: 'radial-gradient(rgba(255,92,106,0.18) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }
        : {
            backgroundImage: 'linear-gradient(135deg, rgba(45,212,191,0.08), transparent 60%)',
          };

  return (
    <div
      className={`relative w-[260px] border bg-[var(--atlas-panel)] px-3 py-2.5 shadow-lg transition-opacity ${kindClass} ${
        selected ? 'ring-2 ring-[var(--atlas-accent)] ring-offset-2 ring-offset-[var(--atlas-bg)]' : ''
      } ${dimmed ? 'opacity-20' : 'opacity-100'}`}
      style={{ borderColor: accent, ...patternStyle }}
      aria-label={`${KIND_LABEL[atlas.type]}: ${atlas.title}, severity ${SEVERITY_LABEL[atlas.severity]}`}
    >
      <Handle type="target" position={targetPos} className="!h-2 !w-2 !border-0 !bg-[var(--atlas-muted)]" />
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border"
          style={{ borderColor: accent, color: accent }}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={KIND_ICON_PATH[atlas.type]} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: accent }}>
          {KIND_SHORT[atlas.type]}
        </span>
        <span
          className={`ml-auto rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide ${severityClass(atlas.severity)}`}
        >
          {atlas.severity}
        </span>
      </div>
      <div className="text-[13px] font-semibold leading-snug text-[var(--atlas-text)]">{atlas.title}</div>
      <div className="mt-1 line-clamp-2 text-[11px] leading-snug text-[var(--atlas-muted)]">{atlas.summary}</div>
      <Handle type="source" position={sourcePos} className="!h-2 !w-2 !border-0 !bg-[var(--atlas-muted)]" />
    </div>
  );
}

export function ThreatNode({ data }: NodeProps<SecFlowNode>) {
  return (
    <NodeShell
      data={data}
      kindClass="clip-threat border-l-[3px] rounded-sm"
      accent="var(--atlas-threat)"
      pattern="slash"
    />
  );
}

export function VulnerabilityNode({ data }: NodeProps<SecFlowNode>) {
  return (
    <NodeShell
      data={data}
      kindClass="rounded-none border-dashed border-2"
      accent="var(--atlas-vuln)"
      pattern="dots"
    />
  );
}

export function GuardrailNode({ data }: NodeProps<SecFlowNode>) {
  return (
    <NodeShell
      data={data}
      kindClass="rounded-xl border-2 border-solid"
      accent="var(--atlas-guard)"
      pattern="solid"
    />
  );
}

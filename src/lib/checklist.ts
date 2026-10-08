import type { AtlasData, AtlasNode } from '../types';

function nodeUrl(id: string) {
  return `${window.location.origin}${window.location.pathname}#node=${id}`;
}

function guardrailItem(g: AtlasNode, data: AtlasData) {
  const fixes = data.edges
    .filter((e) => e.source === g.id && e.relation === 'MITIGATES')
    .map((e) => data.nodes.find((n) => n.id === e.target)?.title)
    .filter(Boolean);
  const lines = [`- [ ] **${g.title}** ([details](${nodeUrl(g.id)}))`, `  - ${g.summary}`];
  if (fixes.length) lines.push(`  - Addresses: ${fixes.join('; ')}`);
  for (const step of g.remediation) lines.push(`  - [ ] ${step}`);
  if (g.verification?.length) lines.push(`  - Verify: ${g.verification.join(' ')}`);
  return lines.join('\n');
}

/** Markdown checklist of guardrails, ready to paste into an issue, doc, or ticket. */
export function buildChecklist(title: string, guardrails: AtlasNode[], data: AtlasData) {
  const header = `## ${title}\n\nFrom ${data.meta.name} v${data.meta.datasetVersion}: ${window.location.origin}${window.location.pathname}\n`;
  return `${header}\n${guardrails.map((g) => guardrailItem(g, data)).join('\n\n')}\n`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API can be blocked (permissions, embedded frames); fall back to a hidden textarea.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

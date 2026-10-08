import type { AtlasData, AtlasNode } from '../types';

export interface RelatedGroup {
  label: string;
  nodes: AtlasNode[];
}

/** Outgoing and incoming edges for a node, phrased from that node's point of view. */
export function relatedGroups(node: AtlasNode, data: AtlasData): RelatedGroup[] {
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const out = (rel: string) =>
    data.edges.filter((e) => e.source === node.id && e.relation === rel).map((e) => byId.get(e.target)!);
  const inc = (rel: string) =>
    data.edges.filter((e) => e.target === node.id && e.relation === rel).map((e) => byId.get(e.source)!);

  const groups: RelatedGroup[] =
    node.type === 'guardrail'
      ? [
          { label: 'Mitigates', nodes: out('MITIGATES') },
          { label: 'Builds on', nodes: out('REQUIRES') },
          { label: 'Needed by', nodes: inc('REQUIRES') },
        ]
      : node.type === 'threat'
        ? [
            { label: 'Exploits', nodes: out('EXPLOITS') },
            { label: 'Leads to', nodes: out('LEADS_TO') },
            { label: 'Follows from', nodes: inc('LEADS_TO') },
            { label: 'Mitigated by', nodes: inc('MITIGATES') },
          ]
        : [
            { label: 'Exploited by', nodes: [...inc('EXPLOITS'), ...inc('LEADS_TO')] },
            { label: 'Mitigated by', nodes: inc('MITIGATES') },
          ];
  return groups.filter((g) => g.nodes.length > 0);
}

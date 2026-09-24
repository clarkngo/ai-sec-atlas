import dagre from '@dagrejs/dagre';
import type { AtlasEdge, AtlasNode, LayoutDirection } from '../types';

export const NODE_WIDTH = 260;
export const NODE_HEIGHT = 108;

export interface LaidOutNode {
  id: string;
  x: number;
  y: number;
}

function layoutComponent(
  ids: string[],
  edges: Pick<AtlasEdge, 'source' | 'target' | 'relation'>[],
  direction: LayoutDirection,
): Map<string, LaidOutNode> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: direction === 'LR' ? 36 : 44,
    ranksep: direction === 'LR' ? 110 : 90,
    marginx: 24,
    marginy: 24,
  });
  g.setDefaultEdgeLabel(() => ({}));
  ids.forEach((id) => g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT }));

  edges.forEach((e) => {
    const invert = e.relation === 'MITIGATES' || e.relation === 'REQUIRES';
    const source = invert ? e.target : e.source;
    const target = invert ? e.source : e.target;
    if (ids.includes(source) && ids.includes(target)) {
      g.setEdge(source, target);
    }
  });

  dagre.layout(g);

  const out = new Map<string, LaidOutNode>();
  ids.forEach((id) => {
    const n = g.node(id);
    out.set(id, { id, x: n.x - NODE_WIDTH / 2, y: n.y - NODE_HEIGHT / 2 });
  });
  return out;
}

/**
 * Rank flow is Threat → Vulnerability → Guardrail.
 * MITIGATES / REQUIRES are inverted for ranking only.
 * When multiple domains are present, each is laid out as its own cluster
 * and offset so domains sit side-by-side (TB) or stacked (LR).
 */
export function layoutGraph(
  nodes: AtlasNode[],
  edges: Pick<AtlasEdge, 'source' | 'target' | 'relation'>[],
  direction: LayoutDirection,
): Map<string, LaidOutNode> {
  const byDomain = new Map<string, AtlasNode[]>();
  for (const n of nodes) {
    const list = byDomain.get(n.domain) ?? [];
    list.push(n);
    byDomain.set(n.domain, list);
  }

  const out = new Map<string, LaidOutNode>();
  let offsetX = 0;
  let offsetY = 0;
  const gap = 120;

  for (const group of byDomain.values()) {
    const ids = group.map((n) => n.id);
    const idSet = new Set(ids);
    const localEdges = edges.filter((e) => idSet.has(e.source) && idSet.has(e.target));
    const local = layoutComponent(ids, localEdges, direction);

    let maxX = 0;
    let maxY = 0;
    local.forEach((p) => {
      maxX = Math.max(maxX, p.x + NODE_WIDTH);
      maxY = Math.max(maxY, p.y + NODE_HEIGHT);
      out.set(p.id, { id: p.id, x: p.x + offsetX, y: p.y + offsetY });
    });

    if (direction === 'TB') {
      offsetX += maxX + gap;
    } else {
      offsetY += maxY + gap;
    }
  }

  return out;
}

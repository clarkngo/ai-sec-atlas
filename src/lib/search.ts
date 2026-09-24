import Fuse from 'fuse.js';
import type { AtlasNode } from '../types';

export function createSearchIndex(nodes: AtlasNode[]) {
  return new Fuse(nodes, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'summary', weight: 0.25 },
      { name: 'frameworks', weight: 0.2 },
      { name: 'domain', weight: 0.1 },
      { name: 'impact', weight: 0.05 },
    ],
    threshold: 0.38,
    includeScore: true,
    ignoreLocation: true,
  });
}

export function searchNodes(fuse: Fuse<AtlasNode>, query: string): Set<string> {
  const q = query.trim();
  if (!q) return new Set();
  return new Set(fuse.search(q).map((r) => r.item.id));
}

import Fuse from 'fuse.js';
import type { AtlasNode, AtlasReference } from '../types';

export function createSearchIndex(nodes: AtlasNode[], references: Record<string, AtlasReference>) {
  return new Fuse(nodes, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'summary', weight: 0.25 },
      {
        name: 'frameworks',
        weight: 0.2,
        // Match official codes and names (e.g. "LLM06:2025", "Excessive Agency"), not just keys.
        getFn: (n) =>
          n.frameworks.flatMap((key) => {
            const r = references[key];
            return r ? [key, r.code, r.name] : [key];
          }),
      },
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

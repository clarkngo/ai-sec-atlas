import Fuse from 'fuse.js';
import type { AtlasNode, AtlasReference } from '../types';

// "LLM07", "ASI06", "AML.T0051", "T0051", "MEASURE 2.7": letters followed by digits.
const ID_LIKE = /^[a-z]{1,8}[\s.:-]*[a-z]?\d[\d.\s:-]*$/i;
const canon = (s: string) => s.toUpperCase().replace(/\s+/g, ' ').trim();

type Index = { fuse: Fuse<AtlasNode>; nodes: AtlasNode[]; references: Record<string, AtlasReference> };

export function createSearchIndex(nodes: AtlasNode[], references: Record<string, AtlasReference>): Index {
  const fuse = new Fuse(nodes, {
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
  return { fuse, nodes, references };
}

/**
 * Framework IDs match exactly on token boundaries, so "LLM07" does not return LLM01 entries
 * and "MEASURE 2.1" does not return MEASURE 2.10. "AML.T0051" also matches its sub-techniques.
 */
function idMatches(index: Index, q: string): AtlasNode[] | null {
  if (!ID_LIKE.test(q)) return null;
  const qq = canon(q);
  const matchesCode = (code: string) => {
    const c = canon(code);
    const i = c.indexOf(qq);
    if (i < 0) return false;
    const before = c[i - 1];
    const after = c[i + qq.length];
    return (!before || !/[A-Z0-9]/.test(before)) && (!after || !/[0-9]/.test(after));
  };
  return index.nodes.filter((n) => n.frameworks.some((key) => matchesCode(index.references[key]?.code ?? key)));
}

export function searchResults(index: Index, query: string): AtlasNode[] {
  const q = query.trim();
  if (!q) return [];
  return idMatches(index, q) ?? index.fuse.search(q).map((r) => r.item);
}

export function searchNodes(index: Index, query: string): Set<string> {
  return new Set(searchResults(index, query).map((n) => n.id));
}

export type View = 'overview' | 'map' | 'list';

export interface UrlState {
  view: View;
  node: string | null;
  domain: string | null;
  path: string | null;
  step: number;
  about: boolean;
}

/**
 * Hash format: `#view=list&domain=…&node=…`, `#path=rag-chatbot&step=2`, `#about`.
 * `#node=<id>` alone (the v0.2 deep-link format) still opens the map.
 */
export function readUrlState(): UrlState {
  const raw = window.location.hash.replace(/^#/, '');
  if (raw === 'about') {
    return { view: 'overview', node: null, domain: null, path: null, step: 0, about: true };
  }
  const p = new URLSearchParams(raw);
  const node = p.get('node');
  const path = p.get('path');
  const v = p.get('view');
  const view: View = v === 'map' || v === 'list' || v === 'overview' ? v : node || path ? 'map' : 'overview';
  const step = Math.max(0, Number.parseInt(p.get('step') ?? '1', 10) - 1) || 0;
  return { view, node, domain: p.get('domain'), path, step, about: false };
}

export function writeUrlState(s: UrlState) {
  let hash = '';
  if (s.about) hash = 'about';
  else {
    const p = new URLSearchParams();
    if (s.path) {
      p.set('path', s.path);
      p.set('step', String(s.step + 1));
      if (s.view !== 'map') p.set('view', s.view);
    } else {
      if (s.view !== 'overview' && !(s.view === 'map' && s.node && !s.domain)) p.set('view', s.view);
      if (s.domain) p.set('domain', s.domain);
      if (s.node) p.set('node', s.node);
    }
    hash = p.toString();
  }
  const base = `${window.location.pathname}${window.location.search}`;
  const next = hash ? `${base}#${hash}` : base;
  if (next !== `${base}${window.location.hash}`) window.history.replaceState(null, '', next);
}

/** localStorage can throw (private mode, blocked storage); treat failures as "unset". */
export function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function writeFlag(key: string) {
  try {
    window.localStorage.setItem(key, '1');
  } catch {
    // Non-essential convenience; ignore.
  }
}

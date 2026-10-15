// Generates crawlable static pages after `vite build`:
//   dist/entry/<id>/index.html  one page per threat, vulnerability, and guardrail
//   dist/entry/index.html       index of all entries by area
//   dist/sitemap.xml
// The interactive app stays the primary UI; these pages exist so search engines,
// link previews, and readers without JavaScript can see the content.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const data = JSON.parse(readFileSync(new URL('public/data/seed-data.json', root), 'utf8'));
const SITE = pkg.homepage.replace(/\/?$/, '/');
const dist = new URL('dist/', root);

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const KIND = { threat: 'Threat', vulnerability: 'Vulnerability', guardrail: 'Guardrail' };
const SEV = { CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
const LVL = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
const SOURCE = {
  'owasp-llm': 'OWASP Top 10 for LLM Applications 2025',
  'owasp-asi': 'OWASP Top 10 for Agentic Applications 2026',
  'mitre-atlas': 'MITRE ATLAS',
  'nist-ai-rmf': 'NIST AI RMF 1.0',
};
const EVIDENCE = { incident: 'Incident', demonstration: 'Demonstration', research: 'Research' };
const byId = new Map(data.nodes.map((n) => [n.id, n]));
const entryUrl = (id) => `${SITE}entry/${id}/`;

function related(n) {
  const out = (rel) => data.edges.filter((e) => e.source === n.id && e.relation === rel).map((e) => byId.get(e.target));
  const inc = (rel) => data.edges.filter((e) => e.target === n.id && e.relation === rel).map((e) => byId.get(e.source));
  const groups =
    n.type === 'guardrail'
      ? [['Mitigates', out('MITIGATES')], ['Builds on', out('REQUIRES')], ['Needed by', inc('REQUIRES')]]
      : n.type === 'threat'
        ? [['Exploits', out('EXPLOITS')], ['Leads to', out('LEADS_TO')], ['Follows from', inc('LEADS_TO')], ['Mitigated by', inc('MITIGATES')]]
        : [['Exploited by', [...inc('EXPLOITS'), ...inc('LEADS_TO')]], ['Mitigated by', inc('MITIGATES')]];
  return groups.filter(([, nodes]) => nodes.length);
}

const sevText = (n) => (n.type === 'guardrail' ? `Fixes ${SEV[n.severity].toLowerCase()} risks` : `${SEV[n.severity]} severity`);

const CSS = `
:root{--bg:#070b14;--panel:#101827;--border:#1c2a3d;--muted:#8b9bb4;--text:#e8eef8;--accent:#38bdf8;--threat:#f5a524;--vuln:#ff5c6a;--guard:#2dd4bf;--crit:#ff3b4e;--high:#f5a524;--med:#38bdf8;--low:#64748b}
@media (prefers-color-scheme: light){:root{--bg:#f7f9fc;--panel:#fff;--border:#d9e1ec;--muted:#536179;--text:#0d1626;--accent:#0369a1;--threat:#b45309;--vuln:#be123c;--guard:#0f766e;--crit:#be123c;--high:#b45309;--med:#0369a1;--low:#475569}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:46rem;margin:0 auto;padding:24px 16px 48px}a{color:var(--accent)}
.crumbs{font-size:13px;color:var(--muted)}.crumbs a{color:var(--muted)}
h1{font-size:1.6rem;line-height:1.25;margin:.4rem 0}h2{font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:2rem 0 .5rem}
.meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:13px}
.tag{border:1px solid var(--border);border-radius:6px;padding:1px 8px;font-size:12px}
.threat{color:var(--threat)}.vulnerability{color:var(--vuln)}.guardrail{color:var(--guard)}
.CRITICAL{color:var(--crit)}.HIGH{color:var(--high)}.MEDIUM{color:var(--med)}.LOW{color:var(--low)}
.card{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:14px 16px}
ul,ol{padding-left:1.2rem}li{margin:.25rem 0}code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
pre{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:12px;overflow-x:auto}
.cta{display:inline-block;margin-top:1rem;padding:8px 14px;border:1px solid var(--accent);border-radius:8px;text-decoration:none}
footer{margin-top:3rem;padding-top:1rem;border-top:1px solid var(--border);font-size:13px;color:var(--muted)}footer a{color:var(--muted)}
.small{font-size:13px;color:var(--muted)}`;

function page({ title, description, canonical, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(data.meta.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta name="twitter:card" content="summary">
<style>${CSS}</style>
</head>
<body>
<main>
${body}
<footer>
${esc(data.meta.name)} v${esc(data.meta.datasetVersion)} · updated ${esc(data.meta.updated)} · <a href="${esc(data.meta.repository)}/blob/main/LICENSE">${esc(data.meta.license)} License</a> · <a href="${esc(data.meta.repository)}">Source on GitHub</a> · <a href="${SITE}#about">About &amp; sources</a><br>
Independent project, not affiliated with or endorsed by MITRE. Framework IDs link to their official pages.
</footer>
</main>
</body>
</html>
`;
}

function entryPage(n) {
  const rel = related(n);
  const refs = Object.entries(
    n.frameworks.reduce((acc, key) => {
      const r = data.references[key];
      (acc[r.source] ??= []).push(r);
      return acc;
    }, {}),
  );
  const rubric = data.meta.severityMethod.rubric;
  const body = `
<p class="crumbs"><a href="${SITE}">${esc(data.meta.name)}</a> › <a href="${SITE}entry/">All entries</a> › ${esc(n.domain)}</p>
<p class="meta"><span class="tag ${n.type}">${KIND[n.type]}</span><span class="tag ${n.severity}">${esc(sevText(n))}</span></p>
<h1>${esc(n.title)}</h1>
<p>${esc(n.summary)}</p>
<a class="cta" href="${SITE}#node=${esc(n.id)}">Open in the interactive atlas →</a>

<h2>Impact</h2>
<p>${esc(n.impact)}</p>

<h2>Why this severity</h2>
${
  n.risk
    ? `<div class="card"><p><strong>Impact ${LVL[n.risk.impact]} × Likelihood ${LVL[n.risk.likelihood]} = <span class="${n.severity}">${SEV[n.severity]}</span></strong></p>
<p>${esc(n.risk.rationale)}</p>
<p class="small">Impact ${LVL[n.risk.impact]}: ${esc(rubric.impact[n.risk.impact])}<br>Likelihood ${LVL[n.risk.likelihood]}: ${esc(rubric.likelihood[n.risk.likelihood])}</p></div>`
    : `<p>Guardrails take the highest severity of the risks they mitigate: ${rel
        .filter(([l]) => l === 'Mitigates')
        .flatMap(([, ns]) => ns)
        .map((m) => `${esc(m.title)} (${SEV[m.severity]})`)
        .join(', ')}.</p>`
}
<p class="small">Method: <a href="${esc(data.meta.severityMethod.url)}">${esc(data.meta.severityMethod.name)}</a></p>
${
  n.evidence?.length
    ? `<h2>Evidence</h2><ul>${n.evidence
        .map((e) => `<li><strong>${EVIDENCE[e.kind]}:</strong> <a href="${esc(e.url)}">${esc(e.title)}</a> <span class="small">(${esc(e.source)}, ${e.year})</span></li>`)
        .join('')}</ul>`
    : ''
}
${rel.length ? `<h2>Related</h2>${rel.map(([label, ns]) => `<p class="small">${label}</p><ul>${ns.map((r) => `<li><a href="${entryUrl(r.id)}">${esc(r.title)}</a> <span class="small">${KIND[r.type]} · ${esc(sevText(r))}</span></li>`).join('')}</ul>`).join('')}` : ''}

<h2>Remediation</h2>
<ol>${n.remediation.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
${n.verification?.length ? `<h2>How to verify</h2><ul>${n.verification.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
${n.codeExample ? `<h2>Pattern</h2><pre><code>${esc(n.codeExample)}</code></pre>` : ''}

<h2>Framework mapping</h2>
${refs
  .map(([src, rs]) => `<p class="small">${SOURCE[src]}</p><ul>${rs.map((r) => `<li><a href="${esc(r.url)}">${esc(r.code)}</a> ${esc(r.name)}</li>`).join('')}</ul>`)
  .join('')}`;
  return page({
    title: `${n.title} (${KIND[n.type]}) · ${data.meta.name}`,
    description: `${n.summary} ${sevText(n)}. Mapped to ${n.frameworks.length} OWASP, MITRE ATLAS, and NIST AI RMF references.`,
    canonical: entryUrl(n.id),
    body,
  });
}

function indexPage() {
  const RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const body = `
<p class="crumbs"><a href="${SITE}">${esc(data.meta.name)}</a> › All entries</p>
<h1>All entries</h1>
<p>${data.nodes.length} threats, vulnerabilities, and guardrails for AI agents, LLM applications, and RAG systems, each mapped to OWASP, MITRE ATLAS, and NIST AI RMF. <a href="${SITE}">Open the interactive atlas</a> to explore how they connect.</p>
${data.domains
  .map((d) => {
    const ns = data.nodes.filter((n) => n.domain === d);
    return `<h2>${esc(d)}</h2><p class="small">${esc(data.domainInfo[d].summary)}</p>${['threat', 'vulnerability', 'guardrail']
      .map((k) => {
        const items = ns.filter((n) => n.type === k).sort((a, b) => RANK[a.severity] - RANK[b.severity]);
        return items.length
          ? `<p class="small ${k}">${KIND[k]}s</p><ul>${items.map((n) => `<li><a href="${entryUrl(n.id)}">${esc(n.title)}</a> <span class="small ${n.severity}">${esc(sevText(n))}</span></li>`).join('')}</ul>`
          : '';
      })
      .join('')}`;
  })
  .join('')}`;
  return page({
    title: `All entries · ${data.meta.name}`,
    description: `Index of ${data.nodes.length} AI security threats, vulnerabilities, and guardrails mapped to OWASP LLM and Agentic Top 10, MITRE ATLAS, and NIST AI RMF.`,
    canonical: `${SITE}entry/`,
    body,
  });
}

const write = (rel, content) => {
  const url = new URL(rel, dist);
  mkdirSync(new URL('.', url), { recursive: true });
  writeFileSync(url, content);
};

for (const n of data.nodes) write(`entry/${n.id}/index.html`, entryPage(n));
write('entry/index.html', indexPage());

const urls = [SITE, `${SITE}entry/`, ...data.nodes.map((n) => entryUrl(n.id))];
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${esc(data.meta.updated)}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`,
);
// robots.txt is only read at the domain root (clarkngo.github.io), so it is not generated here.

console.log(`Static pages: ${data.nodes.length} entries + index, sitemap with ${urls.length} URLs.`);

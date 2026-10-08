// Fails the build if the dataset is internally inconsistent:
// unknown framework references, severities that don't follow the
// documented OWASP Risk Rating method, or dangling edges.
import { readFileSync } from 'node:fs';

const path = new URL('../public/data/seed-data.json', import.meta.url);
const data = JSON.parse(readFileSync(path, 'utf8'));

const MATRIX = {
  'HIGH/HIGH': 'CRITICAL',
  'HIGH/MEDIUM': 'HIGH',
  'MEDIUM/HIGH': 'HIGH',
  'HIGH/LOW': 'MEDIUM',
  'MEDIUM/MEDIUM': 'MEDIUM',
  'LOW/HIGH': 'MEDIUM',
  'MEDIUM/LOW': 'LOW',
  'LOW/MEDIUM': 'LOW',
  'LOW/LOW': 'LOW',
};
const RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

const errors = [];
const ids = new Set();
const byId = new Map();
const sourceIds = new Set(data.sources.map((s) => s.id));

for (const [key, ref] of Object.entries(data.references)) {
  if (!sourceIds.has(ref.source)) errors.push(`reference ${key}: unknown source ${ref.source}`);
  if (!/^https:\/\//.test(ref.url)) errors.push(`reference ${key}: url must be https`);
}

for (const n of data.nodes) {
  if (ids.has(n.id)) errors.push(`duplicate node id ${n.id}`);
  ids.add(n.id);
  byId.set(n.id, n);
  if (!data.domains.includes(n.domain)) errors.push(`${n.id}: unknown domain ${n.domain}`);
  if (!n.frameworks.length) errors.push(`${n.id}: no framework mapping`);
  for (const f of n.frameworks) {
    if (!data.references[f]) errors.push(`${n.id}: framework ${f} missing from references`);
  }
  if (n.type === 'guardrail') {
    if (n.risk) errors.push(`${n.id}: guardrails take derived severity, not a risk score`);
  } else {
    if (!n.risk?.rationale) errors.push(`${n.id}: missing risk score or rationale`);
    else {
      const expected = MATRIX[`${n.risk.impact}/${n.risk.likelihood}`];
      if (n.severity !== expected) {
        errors.push(`${n.id}: severity ${n.severity} != ${expected} from impact ${n.risk.impact} x likelihood ${n.risk.likelihood}`);
      }
    }
  }
}

for (const e of data.edges) {
  if (!ids.has(e.source)) errors.push(`edge ${e.id}: unknown source ${e.source}`);
  if (!ids.has(e.target)) errors.push(`edge ${e.id}: unknown target ${e.target}`);
}

for (const n of data.nodes.filter((x) => x.type === 'guardrail')) {
  const targets = data.edges
    .filter((e) => e.source === n.id && e.relation === 'MITIGATES')
    .map((e) => byId.get(e.target))
    .filter(Boolean);
  if (!targets.length) {
    errors.push(`${n.id}: guardrail mitigates nothing`);
    continue;
  }
  const expected = targets.reduce((a, t) => (RANK[t.severity] > RANK[a] ? t.severity : a), 'LOW');
  if (n.severity !== expected) errors.push(`${n.id}: guardrail severity ${n.severity} != ${expected} (max of mitigated)`);
}

for (const d of data.domains) {
  if (!data.domainInfo?.[d]?.summary) errors.push(`domain "${d}": missing domainInfo summary`);
}

const pathIds = new Set();
for (const p of data.paths ?? []) {
  if (pathIds.has(p.id)) errors.push(`duplicate path id ${p.id}`);
  pathIds.add(p.id);
  if (!p.steps?.length) errors.push(`path ${p.id}: no steps`);
  for (const [i, st] of (p.steps ?? []).entries()) {
    if (!ids.has(st.node)) errors.push(`path ${p.id} step ${i + 1}: unknown node ${st.node}`);
    if (!st.note) errors.push(`path ${p.id} step ${i + 1}: missing note`);
  }
}

if (errors.length) {
  console.error(`Dataset validation failed (${errors.length}):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log(
  `Dataset OK: ${data.nodes.length} nodes, ${data.edges.length} edges, ${Object.keys(data.references).length} references, ${pathIds.size} paths.`,
);

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
} from '@xyflow/react';
import type { AtlasData, AtlasNode, LayoutDirection, Severity } from './types';
import { layoutGraph, NODE_HEIGHT, NODE_WIDTH } from './lib/layout';
import { createSearchIndex, searchNodes } from './lib/search';
import { RELATION_LABEL } from './lib/theme';
import { Header } from './components/Header';
import { DetailPanel } from './components/DetailPanel';
import { Legend, StatusBar } from './components/Legend';
import {
  GuardrailNode,
  ThreatNode,
  VulnerabilityNode,
  type SecFlowNode,
} from './components/nodes/SecNodes';

const nodeTypes = {
  threat: ThreatNode,
  vulnerability: VulnerabilityNode,
  guardrail: GuardrailNode,
};

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function edgeClass(relation: string, active: boolean, dimmed: boolean) {
  const base = `edge-${relation.toLowerCase()}`;
  if (dimmed) return `${base} edge-dimmed`;
  if (active) return `${base} edge-active`;
  return base;
}

export default function App() {
  const [data, setData] = useState<AtlasData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/seed-data.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<AtlasData>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-[var(--atlas-muted)]">
        Could not load threat database ({error}).
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex h-full items-center justify-center font-mono text-sm text-[var(--atlas-muted)]">
        Loading atlas…
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <Atlas data={data} />
    </ReactFlowProvider>
  );
}

function Atlas({ data }: { data: AtlasData }) {
  const rf = useReactFlow<SecFlowNode>();

  const [domain, setDomain] = useState<string | 'ALL'>('ALL');
  const [severity, setSeverity] = useState<Severity | 'ALL'>('ALL');
  const [direction, setDirection] = useState<LayoutDirection>('TB');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fuse = useMemo(() => createSearchIndex(data.nodes), [data.nodes]);
  const matchIds = useMemo(() => searchNodes(fuse, query), [fuse, query]);
  const searching = query.trim().length > 0;

  const filteredNodes = useMemo(() => {
    return data.nodes.filter((n) => {
      if (domain !== 'ALL' && n.domain !== domain) return false;
      if (severity !== 'ALL' && n.severity !== severity) return false;
      return true;
    });
  }, [data.nodes, domain, severity]);

  const filteredIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return data.edges.filter((e) => filteredIds.has(e.source) && filteredIds.has(e.target));
  }, [data.edges, filteredIds]);

  const positions = useMemo(
    () => layoutGraph(filteredNodes, filteredEdges, direction),
    [filteredNodes, filteredEdges, direction],
  );

  const selected = selectedId ? data.nodes.find((n) => n.id === selectedId) ?? null : null;

  const neighborIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const s = new Set<string>([selectedId]);
    for (const e of data.edges) {
      if (e.source === selectedId) s.add(e.target);
      if (e.target === selectedId) s.add(e.source);
    }
    return s;
  }, [selectedId, data.edges]);

  const flowNodes: SecFlowNode[] = useMemo(() => {
    return filteredNodes.map((atlas) => {
      const pos = positions.get(atlas.id) ?? { x: 0, y: 0 };
      const dimmed = searching ? !matchIds.has(atlas.id) : selectedId ? !neighborIds.has(atlas.id) : false;
      return {
        id: atlas.id,
        type: atlas.type,
        position: { x: pos.x, y: pos.y },
        data: {
          atlas,
          selected: selectedId === atlas.id,
          dimmed,
          direction,
        },
        style: { width: NODE_WIDTH, height: NODE_HEIGHT },
        draggable: false,
      };
    });
  }, [filteredNodes, positions, searching, matchIds, selectedId, neighborIds, direction]);

  const flowEdges: Edge[] = useMemo(() => {
    return filteredEdges.map((e) => {
      const touchesSelection = selectedId === e.source || selectedId === e.target;
      const searchRelevant =
        !searching || (matchIds.has(e.source) && matchIds.has(e.target));
      const dimmed = searching ? !searchRelevant : selectedId ? !touchesSelection : false;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: RELATION_LABEL[e.relation],
        labelStyle: {
          fill: 'var(--atlas-muted)',
          fontSize: 9,
          fontFamily: 'IBM Plex Mono, monospace',
        },
        labelBgStyle: { fill: 'var(--atlas-panel)', fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
        className: edgeClass(e.relation, touchesSelection && !searching, dimmed),
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color:
            e.relation === 'MITIGATES'
              ? 'var(--atlas-guard)'
              : e.relation === 'EXPLOITS'
                ? 'var(--atlas-vuln)'
                : e.relation === 'REQUIRES'
                  ? 'var(--atlas-accent)'
                  : 'var(--atlas-threat)',
        },
      };
    });
  }, [filteredEdges, selectedId, searching, matchIds]);

  const metrics = useMemo(() => {
    const visible = searching
      ? filteredNodes.filter((n) => matchIds.has(n.id))
      : filteredNodes;
    return {
      critical: visible.filter((n) => n.severity === 'CRITICAL').length,
      high: visible.filter((n) => n.severity === 'HIGH').length,
      total: visible.length,
    };
  }, [filteredNodes, searching, matchIds]);

  const fit = useCallback(() => {
    rf.fitView({ padding: 0.18, maxZoom: 1, duration: reduceMotion() ? 0 : 300 });
  }, [rf]);

  useEffect(() => {
    const t = window.setTimeout(fit, 40);
    return () => window.clearTimeout(t);
  }, [direction, domain, severity, fit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[type="search"]');
        input?.focus();
        input?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: SecFlowNode) => {
    setSelectedId(node.id);
  }, []);

  const reset = useCallback(() => {
    setDomain('ALL');
    setSeverity('ALL');
    setQuery('');
    setSelectedId(null);
    setDirection('TB');
  }, []);

  const minimapColor = (n: SecFlowNode) => {
    const t = (n.data as { atlas: AtlasNode }).atlas.type;
    if (t === 'threat') return '#f5a524';
    if (t === 'vulnerability') return '#ff5c6a';
    return '#2dd4bf';
  };

  return (
    <div className="flex h-full flex-col">
      <Header
        data={data}
        domain={domain}
        onDomain={setDomain}
        severity={severity}
        onSeverity={setSeverity}
        direction={direction}
        onDirection={setDirection}
        query={query}
        onQuery={setQuery}
        onFit={fit}
        onReset={reset}
        metrics={metrics}
      />

      <main className="relative min-h-0 flex-1">
        <div className="atlas-grid pointer-events-none absolute inset-0" aria-hidden />
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedId(null)}
          nodesConnectable={false}
          nodesDraggable={false}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
          minZoom={0.2}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
          className="bg-transparent"
        >
          <Background gap={32} size={1} color="rgba(28,42,61,0.55)" />
          <Controls showInteractive={false} position="bottom-right" />
          <MiniMap
            pannable
            zoomable
            position="top-right"
            className="!hidden md:!block"
            nodeColor={(n) => minimapColor(n as SecFlowNode)}
            maskColor="rgba(7,11,20,0.75)"
          />
        </ReactFlow>

        <Legend />
        <StatusBar
          visible={metrics.total}
          total={data.nodes.length}
          selectedTitle={selected?.title ?? null}
        />
      </main>

      {selected && <DetailPanel node={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

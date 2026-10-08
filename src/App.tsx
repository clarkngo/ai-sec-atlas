import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { createSearchIndex, searchNodes, searchResults } from './lib/search';
import { readFlag, readUrlState, writeFlag, writeUrlState, type View } from './lib/urlState';
import { buildChecklist, copyText } from './lib/checklist';
import { play } from './lib/sound';
import { RELATION_LABEL } from './lib/theme';
import { Header } from './components/Header';
import { DetailPanel, type PathNav } from './components/DetailPanel';
import { Overview } from './components/Overview';
import { ListView } from './components/ListView';
import { Guide } from './components/Guide';
import { AboutDialog } from './components/AboutDialog';
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

const GUIDE_KEY = 'atlas.guideSeen';
const PANEL_WIDTH = 416; // DetailPanel is 26rem wide on md+

function Atlas({ data }: { data: AtlasData }) {
  const rf = useReactFlow<SecFlowNode>();
  const nodeById = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data.nodes]);
  const pathById = useMemo(() => new Map(data.paths.map((p) => [p.id, p])), [data.paths]);

  // Initial state comes from the URL so shared links reopen the same view.
  const initial = useMemo(() => {
    const u = readUrlState();
    const path = u.path && pathById.get(u.path) ? { id: u.path, step: Math.min(u.step, pathById.get(u.path)!.steps.length - 1) } : null;
    const node = path ? pathById.get(path.id)!.steps[path.step].node : u.node && nodeById.has(u.node) ? u.node : null;
    const domain = u.domain && data.domains.includes(u.domain) ? u.domain : 'ALL';
    return { ...u, path, node, domain };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [view, setView] = useState<View>(initial.view);
  const [domain, setDomain] = useState<string | 'ALL'>(initial.domain);
  const [severity, setSeverity] = useState<Severity | 'ALL'>('ALL');
  const [direction, setDirection] = useState<LayoutDirection>('TB');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initial.node);
  const [path, setPath] = useState<{ id: string; step: number } | null>(initial.path);
  const [aboutOpen, setAboutOpen] = useState(initial.about);
  const [guideOpen, setGuideOpen] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(initial.node ? 1 : 0);

  useEffect(() => {
    writeUrlState({
      view,
      node: path ? null : selectedId,
      domain: path || domain === 'ALL' ? null : domain,
      path: path?.id ?? null,
      step: path?.step ?? 0,
      about: aboutOpen,
    });
  }, [view, selectedId, domain, path, aboutOpen]);

  useEffect(() => {
    const onHash = () => {
      const u = readUrlState();
      setAboutOpen(u.about);
      if (u.about) return;
      setView(u.view);
      const p = u.path ? pathById.get(u.path) : undefined;
      if (p) {
        const step = Math.min(u.step, p.steps.length - 1);
        setPath({ id: p.id, step });
        setSelectedId(p.steps[step].node);
        setDomain('ALL');
        setSeverity('ALL');
      } else {
        setPath(null);
        setSelectedId(u.node && nodeById.has(u.node) ? u.node : null);
        setDomain(u.domain && data.domains.includes(u.domain) ? u.domain : 'ALL');
      }
      setFocusTick((t) => t + 1);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [data.domains, nodeById, pathById]);

  const fuse = useMemo(() => createSearchIndex(data.nodes, data.references), [data.nodes, data.references]);
  const matchIds = useMemo(() => searchNodes(fuse, query), [fuse, query]);
  const results = useMemo(() => searchResults(fuse, query), [fuse, query]);
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

  const selected = selectedId ? nodeById.get(selectedId) ?? null : null;
  const activePath = path ? pathById.get(path.id) ?? null : null;
  const pathNodeIds = useMemo(() => new Set(activePath?.steps.map((s) => s.node) ?? []), [activePath]);

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
      const dimmed = searching
        ? !matchIds.has(atlas.id)
        : activePath
          ? !pathNodeIds.has(atlas.id) && !neighborIds.has(atlas.id)
          : selectedId
            ? !neighborIds.has(atlas.id)
            : false;
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
  }, [filteredNodes, positions, searching, matchIds, activePath, pathNodeIds, selectedId, neighborIds, direction]);

  const flowEdges: Edge[] = useMemo(() => {
    return filteredEdges.map((e) => {
      const touchesSelection = selectedId === e.source || selectedId === e.target;
      const searchRelevant = !searching || (matchIds.has(e.source) && matchIds.has(e.target));
      const dimmed = searching ? !searchRelevant : selectedId ? !touchesSelection : false;
      // Labels only where they help: around the selected card or the hovered edge.
      const showLabel = (touchesSelection && !searching) || hoveredEdge === e.id;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: showLabel ? RELATION_LABEL[e.relation] : undefined,
        labelStyle: {
          fill: 'var(--atlas-text)',
          fontSize: 10,
          fontFamily: 'IBM Plex Mono, monospace',
        },
        labelBgStyle: { fill: 'var(--atlas-panel)', fillOpacity: 0.95 },
        labelBgPadding: [4, 2] as [number, number],
        className: edgeClass(e.relation, touchesSelection && !searching, dimmed),
        interactionWidth: 16,
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
  }, [filteredEdges, selectedId, searching, matchIds, hoveredEdge]);

  const visibleNodes = useMemo(
    () => (searching ? filteredNodes.filter((n) => matchIds.has(n.id)) : filteredNodes),
    [filteredNodes, searching, matchIds],
  );

  const metrics = useMemo(() => {
    // Guardrail severity is derived from what they mitigate, so only risks are counted.
    const risks = visibleNodes.filter((n) => n.type !== 'guardrail');
    return {
      critical: risks.filter((n) => n.severity === 'CRITICAL').length,
      high: risks.filter((n) => n.severity === 'HIGH').length,
      total: visibleNodes.length,
    };
  }, [visibleNodes]);

  const fit = useCallback(() => {
    rf.fitView({ padding: 0.18, maxZoom: 1, duration: reduceMotion() ? 0 : 300 });
  }, [rf]);

  // Refit when filters change, unless a selected card is about to be centered instead.
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  useEffect(() => {
    if (view !== 'map' || selectedRef.current) return;
    const t = window.setTimeout(fit, 40);
    return () => window.clearTimeout(t);
  }, [direction, domain, severity, fit, view]);

  // Center a card in the area not covered by the detail panel (right side) or bottom sheet.
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const centerOn = useCallback(
    (id: string, onlyIfHidden: boolean) => {
      const pos = positionsRef.current.get(id);
      if (!pos) return;
      const wide = window.innerWidth >= 768;
      const current = rf.getZoom();
      if (onlyIfHidden) {
        const tl = rf.flowToScreenPosition({ x: pos.x, y: pos.y });
        const br = rf.flowToScreenPosition({ x: pos.x + NODE_WIDTH, y: pos.y + NODE_HEIGHT });
        const visibleRight = wide ? window.innerWidth - PANEL_WIDTH : window.innerWidth;
        const visibleBottom = wide ? window.innerHeight : window.innerHeight * 0.22;
        if (tl.x >= 0 && br.x <= visibleRight && tl.y >= 0 && br.y <= visibleBottom) return;
      }
      const zoom = onlyIfHidden ? current : Math.max(current, 0.85);
      const dx = wide ? PANEL_WIDTH / 2 / zoom : 0;
      const dy = wide ? 0 : (window.innerHeight * 0.3) / zoom;
      rf.setCenter(pos.x + NODE_WIDTH / 2 + dx, pos.y + NODE_HEIGHT / 2 + dy, {
        zoom,
        duration: reduceMotion() ? 0 : 450,
      });
    },
    [rf],
  );

  useEffect(() => {
    if (view !== 'map' || !focusTick || !selectedId) return;
    const t = window.setTimeout(() => centerOn(selectedId, false), 120);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTick, view]);

  // First visit to the map: offer the reading guide (not over a deep link or path).
  useEffect(() => {
    if (view === 'map' && !selectedId && !path && !readFlag(GUIDE_KEY)) setGuideOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  /** Select a card, widening filters if it is hidden, and center it on the map. */
  const select = useCallback(
    (id: string, opts: { keepPath?: boolean } = {}) => {
      const n = nodeById.get(id);
      if (!n) return;
      if (domain !== 'ALL' && n.domain !== domain) setDomain('ALL');
      if (severity !== 'ALL' && n.severity !== severity) setSeverity('ALL');
      if (!opts.keepPath) setPath(null);
      setSelectedId(id);
      setFocusTick((t) => t + 1);
      play('select');
    },
    [nodeById, domain, severity],
  );

  const changeView = useCallback(
    (v: View) => {
      if (v === view) return;
      play('switch');
      setView(v);
      if (v === 'overview') {
        setSelectedId(null);
        setPath(null);
      }
      if (v === 'map' && selectedId) setFocusTick((t) => t + 1);
    },
    [view, selectedId],
  );

  const pick = useCallback(
    (id: string) => {
      setQuery('');
      if (view === 'overview') setView('map');
      select(id);
    },
    [view, select],
  );

  const goToStep = useCallback(
    (pathId: string, step: number) => {
      const p = pathById.get(pathId);
      if (!p) return;
      setDomain('ALL');
      setSeverity('ALL');
      setQuery('');
      setPath({ id: pathId, step });
      setSelectedId(p.steps[step].node);
      setFocusTick((t) => t + 1);
      play('step');
    },
    [pathById],
  );

  const startPath = useCallback(
    (pathId: string) => {
      setView((v) => (v === 'overview' ? 'map' : v));
      goToStep(pathId, 0);
    },
    [goToStep],
  );

  const openDomain = useCallback((d: string | 'ALL', v: 'map' | 'list') => {
    play('switch');
    setDomain(d);
    setSeverity('ALL');
    setSelectedId(null);
    setPath(null);
    setView(v);
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: SecFlowNode) => {
    setPath((p) => (p && pathById.get(p.id)?.steps[p.step].node === node.id ? p : null));
    setSelectedId(node.id);
    play('select');
    window.setTimeout(() => centerOn(node.id, true), 60);
  }, [pathById, centerOn]);

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setPath(null);
    play('close');
  }, []);
  const closeAbout = useCallback(() => setAboutOpen(false), []);
  const openAbout = useCallback(() => {
    play('open');
    setAboutOpen(true);
  }, []);
  const openGuide = useCallback(() => {
    play('open');
    setGuideOpen(true);
  }, []);
  const closeGuide = useCallback(() => {
    writeFlag(GUIDE_KEY);
    setGuideOpen(false);
  }, []);

  const reset = useCallback(() => {
    setDomain('ALL');
    setSeverity('ALL');
    setQuery('');
  }, []);

  const pathNav: PathNav | undefined =
    activePath && path && selectedId === activePath.steps[path.step].node
      ? {
          title: activePath.title,
          step: path.step,
          total: activePath.steps.length,
          note: activePath.steps[path.step].note,
          onPrev: () => goToStep(activePath.id, Math.max(0, path.step - 1)),
          onNext: () => goToStep(activePath.id, Math.min(activePath.steps.length - 1, path.step + 1)),
          onExit: () => {
            setPath(null);
            play('close');
          },
          onCopyChecklist: async () => {
            const guards = activePath.steps
              .map((s) => nodeById.get(s.node)!)
              .filter((n) => n.type === 'guardrail');
            const ok = await copyText(buildChecklist(`${activePath.title}: checklist`, guards, data));
            if (ok) play('success');
            return ok;
          },
        }
      : undefined;

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
        view={view}
        onView={changeView}
        domain={domain}
        onDomain={setDomain}
        severity={severity}
        onSeverity={setSeverity}
        direction={direction}
        onDirection={setDirection}
        query={query}
        onQuery={setQuery}
        results={results}
        onPick={pick}
        onFit={fit}
        onReset={reset}
        onAbout={openAbout}
        onGuide={openGuide}
        metrics={metrics}
      />

      <div className="relative flex min-h-0 flex-1">
        <main className={`relative min-h-0 min-w-0 flex-1 ${selected && view === 'list' ? 'md:pr-[26rem]' : ''}`}>
          {view === 'overview' && (
            <Overview data={data} onOpenDomain={openDomain} onStartPath={startPath} onGuide={openGuide} />
          )}

          {view === 'list' && (
            <ListView data={data} nodes={visibleNodes} selectedId={selectedId} onSelect={(id) => select(id)} />
          )}

          {view === 'map' && (
            <>
              <div className="atlas-grid pointer-events-none absolute inset-0" aria-hidden />
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                onInit={() => {
                  // Deep links: center once the viewport exists (the focus effect may run before it does).
                  if (selectedRef.current) window.setTimeout(() => centerOn(selectedRef.current!, false), 60);
                }}
                onPaneClick={() => selectedId && closeDetail()}
                onEdgeMouseEnter={(_, e) => setHoveredEdge(e.id)}
                onEdgeMouseLeave={() => setHoveredEdge(null)}
                nodesConnectable={false}
                nodesDraggable={false}
                elementsSelectable={false}
                fitView={!initial.node}
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
            </>
          )}

          <StatusBar
            visible={metrics.total}
            total={data.nodes.length}
            selectedTitle={selected?.title ?? null}
            showCount={view === 'map'}
            repository={data.meta.repository}
            license={data.meta.license}
            onAbout={openAbout}
          />
        </main>

        {selected && view !== 'overview' && (
          <DetailPanel node={selected} data={data} onClose={closeDetail} onSelect={(id) => select(id)} path={pathNav} />
        )}
      </div>
      {aboutOpen && <AboutDialog data={data} onClose={closeAbout} />}
      {guideOpen && (
        <Guide
          onClose={closeGuide}
          onList={() => {
            closeGuide();
            changeView('list');
          }}
        />
      )}
    </div>
  );
}

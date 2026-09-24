export type NodeKind = 'threat' | 'vulnerability' | 'guardrail';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type EdgeRelation = 'EXPLOITS' | 'MITIGATES' | 'REQUIRES' | 'LEADS_TO';

export type LayoutDirection = 'TB' | 'LR';

export interface AtlasNode {
  id: string;
  type: NodeKind;
  title: string;
  summary: string;
  domain: string;
  severity: Severity;
  frameworks: string[];
  impact: string;
  remediation: string[];
  verification?: string[];
  codeExample?: string;
}

export interface AtlasEdge {
  id: string;
  source: string;
  target: string;
  relation: EdgeRelation;
}

export interface AtlasData {
  domains: string[];
  nodes: AtlasNode[];
  edges: AtlasEdge[];
}

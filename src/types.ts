export type NodeKind = 'threat' | 'vulnerability' | 'guardrail';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type EdgeRelation = 'EXPLOITS' | 'MITIGATES' | 'REQUIRES' | 'LEADS_TO';

export type LayoutDirection = 'TB' | 'LR';

export type SourceId = 'owasp-llm' | 'owasp-asi' | 'mitre-atlas' | 'nist-ai-rmf';

/** OWASP Risk Rating inputs. Present on threats and vulnerabilities only. */
export interface RiskScore {
  impact: RiskLevel;
  likelihood: RiskLevel;
  rationale: string;
}

export interface AtlasNode {
  id: string;
  type: NodeKind;
  title: string;
  summary: string;
  domain: string;
  /**
   * Threats/vulnerabilities: OWASP Risk Rating matrix of `risk`.
   * Guardrails: highest severity among the nodes they MITIGATE.
   */
  severity: Severity;
  risk?: RiskScore;
  impact: string;
  remediation: string[];
  verification?: string[];
  codeExample?: string;
  /** Keys into `AtlasData.references`. */
  frameworks: string[];
}

export interface AtlasEdge {
  id: string;
  source: string;
  target: string;
  relation: EdgeRelation;
}

export interface AtlasSource {
  id: SourceId;
  name: string;
  version: string;
  url: string;
}

export interface AtlasReference {
  source: SourceId;
  code: string;
  name: string;
  url: string;
}

export interface AtlasMeta {
  name: string;
  datasetVersion: string;
  updated: string;
  license: string;
  repository: string;
  severityMethod: { name: string; url: string; summary: string };
}

export interface AtlasData {
  meta: AtlasMeta;
  sources: AtlasSource[];
  references: Record<string, AtlasReference>;
  domains: string[];
  nodes: AtlasNode[];
  edges: AtlasEdge[];
}

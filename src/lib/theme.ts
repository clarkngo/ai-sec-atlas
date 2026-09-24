import type { EdgeRelation, NodeKind, Severity } from '../types';

export const KIND_LABEL: Record<NodeKind, string> = {
  threat: 'Threat',
  vulnerability: 'Vulnerability',
  guardrail: 'Guardrail',
};

export const KIND_SHORT: Record<NodeKind, string> = {
  threat: 'THR',
  vulnerability: 'VUL',
  guardrail: 'GRD',
};

export const KIND_ICON_PATH: Record<NodeKind, string> = {
  // alert triangle
  threat: 'M12 3L22 20H2L12 3zm0 5v6m0 3h.01',
  // broken shield / cross
  vulnerability: 'M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3zm-3 9h6',
  // shield check
  guardrail: 'M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3zm-2.5 8.5l2.5 2.5 5-5',
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export const RELATION_LABEL: Record<EdgeRelation, string> = {
  EXPLOITS: 'exploits',
  MITIGATES: 'mitigates',
  REQUIRES: 'requires',
  LEADS_TO: 'leads to',
};

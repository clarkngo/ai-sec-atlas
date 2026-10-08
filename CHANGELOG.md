# Changelog

Dataset and app versions follow [Semantic Versioning](https://semver.org/).

## 0.3.0 — 2026-10-07

- New Overview start page: one card per area with a plain-language description and risk counts, plus guided paths.
- Three guided paths ("Securing an MCP-connected agent", "Hardening a RAG chatbot", "Bringing in an open-weights model") that step through entries with a note at each step. Paths are stored in the dataset and checked by the validator.
- List view grouped by area and sorted by severity, for phones, screen readers, and quick scanning.
- Detail panel now lists related entries (exploits, mitigated by, and so on) as links, so you can go from a threat to its fix without searching the map.
- Search shows a results dropdown with keyboard navigation; framework IDs such as `LLM07` or `AML.T0051` match exactly.
- First-visit "How to read the map" guide; edge labels appear only around the selected card or on hover; plainer legend.
- Guardrail badges read "Fixes critical" instead of "FOR CRITICAL". Layout direction moved into a Layout menu.
- Copy any area or path as a Markdown checklist of guardrails, remediation steps, and tests.
- Optional sound effects (synthesized, no audio files) with a mute toggle that is remembered.
- Links keep the view, area, entry, or path step (`#view=list&node=…`, `#path=rag-chatbot&step=3`). Old `#node=…` links still work.

## 0.2.0 — 2026-10-07

- Every entry now links to official framework references: OWASP Top 10 for LLM Applications 2025, OWASP Top 10 for Agentic Applications 2026, MITRE ATLAS (2026.09 data release), and NIST AI RMF 1.0.
- Corrected framework IDs that did not exist or were mis-numbered (e.g. `NIST-AI-6.1`, `MITRE-AML.D0005`, NIST MEASURE 2.2) and remapped OWASP LLM IDs to their 2025 meanings.
- Severity is now derived from OWASP Risk Rating impact × likelihood scores, with a written rationale per threat and vulnerability. Guardrails show the highest severity they address. `t-data-poison` moved from Critical to High as a result.
- Added About dialog, version and license display, deep links to entries, MIT license, citation file, and issue templates.
- `npm run build` now validates the dataset (unknown references, severity inconsistencies, dangling edges).

## 0.1.0

- Initial release with two domains; three more domains (46 nodes total) added in PR #2.

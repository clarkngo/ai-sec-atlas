# Changelog

Dataset and app versions follow [Semantic Versioning](https://semver.org/).

## 0.2.0 — 2026-10-07

- Every entry now links to official framework references: OWASP Top 10 for LLM Applications 2025, OWASP Top 10 for Agentic Applications 2026, MITRE ATLAS (2026.09 data release), and NIST AI RMF 1.0.
- Corrected framework IDs that did not exist or were mis-numbered (e.g. `NIST-AI-6.1`, `MITRE-AML.D0005`, NIST MEASURE 2.2) and remapped OWASP LLM IDs to their 2025 meanings.
- Severity is now derived from OWASP Risk Rating impact × likelihood scores, with a written rationale per threat and vulnerability. Guardrails show the highest severity they address. `t-data-poison` moved from Critical to High as a result.
- Added About dialog, version and license display, deep links to entries, MIT license, citation file, and issue templates.
- `npm run build` now validates the dataset (unknown references, severity inconsistencies, dangling edges).

## 0.1.0

- Initial release with two domains; three more domains (46 nodes total) added in PR #2.

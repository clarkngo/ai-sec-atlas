# Changelog

Dataset and app versions follow [Semantic Versioning](https://semver.org/).

## 0.5.0 — 2026-10-15

- **Severity recalibrated against a written rubric.** Likelihood High now requires a documented real-world incident and no special attacker access; Medium means public demonstration or research, or real-world use that needed a foothold; Low means no public cases or privileged access. Impact levels are defined the same way. Risks moved from 13 Critical / 31 High / 4 Medium to 8 / 26 / 14. Ten ratings went down (e.g. Agent Tool Hijacking, Output-Rendered Data Exfiltration: Critical → High, as only demonstrations are documented) and two went up (Mutable Tool Manifests, Memory Writes Without Provenance: High → Critical, backed by the Postmark MCP and AI recommendation poisoning incidents).
- **Evidence on 42 entries (80 citations):** MITRE ATLAS case studies labeled Incident or Demonstration from the 2026.09 data release, 12 arXiv papers (titles checked against the arXiv API), and the Moffatt v. Air Canada tribunal decision. Shown in the detail panel and on entry pages.
- **The build enforces the rubric:** High likelihood without an incident, or a Medium/High-likelihood threat without evidence, fails validation.
- **Static pages for every entry** at `/entry/<id>/`, an index at `/entry/`, and `sitemap.xml`, so content is readable by search engines, link previews, and readers without JavaScript. "Copy link" and checklist exports now point to these pages. Open Graph and canonical tags on all pages.

## 0.4.0 — 2026-10-07

Coverage pass against the OWASP Top 10 for LLM Applications 2025 and the OWASP Top 10 for Agentic Applications 2026. Every item in both lists now has at least one threat and one guardrail, and every threat and vulnerability has at least one mitigation. 28 new entries (74 total):

- **LLM09 Misinformation** (previously no threat or guardrail): hallucinated answers acted on, ungrounded answers, interfaces that invite overreliance, grounding and citation verification, uncertainty labeling with high-stakes review.
- **Hallucinated package squatting** (OWASP LLM09 scenario 1; ATLAS AML.T0060, AML.T0062), unreviewed AI-suggested code and dependencies, dependency allowlisting.
- **LLM10 Unbounded Consumption**: denial of wallet and resource exhaustion, missing per-request limits, resource budgets with graceful degradation (ATLAS AML.M0036).
- **LLM08 / LLM02**: embedding inversion and membership inference, embeddings treated as non-sensitive, training data memorization, unscrubbed fine-tuning data, and their guardrails.
- **ASI05 Unexpected Code Execution**: prompt-to-code execution threat and a hardened execution sandbox. The existing "Dynamic Code Execution" vulnerability previously had no mitigating guardrail.
- **ASI08 Cascading Failures**, **ASI09 Human-Agent Trust Exploitation**, **ASI10 Rogue Agents**: threats, vulnerabilities, and guardrails (circuit breakers, verifiable approval previews, behavioral monitoring with a kill switch).
- Two new guided paths: "Keeping an autonomous agent under control" and "Shipping answers people can trust".
- 21 new framework references (ATLAS IDs and names checked against the 2026.09 data release; NIST MEASURE 2.5, 2.8, 2.9, MANAGE 4.1).
- Layout fixes: the search box no longer collapses at tablet widths; on phones the header is shorter, the legend starts collapsed, and the footer is hidden in Map view.

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

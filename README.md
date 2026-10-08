# AI Security Atlas

Interactive threat model for AI agents, LLM applications, and RAG systems. Start at an adversarial threat, trace it to the vulnerabilities it exploits, and land on concrete guardrails with remediation steps, verification tests, and code patterns. Every entry is mapped to OWASP, MITRE ATLAS, and NIST AI RMF references.

**Live:** https://clarkngo.github.io/ai-sec-atlas/ · **Version:** 0.4.0 ([changelog](CHANGELOG.md)) · **License:** [MIT](LICENSE)

> **Not MITRE ATLAS.** This is an independent project, not affiliated with or endorsed by MITRE. [MITRE ATLAS](https://atlas.mitre.org/) is MITRE's knowledge base of adversary tactics, techniques, and case studies against AI systems, written from the attacker's point of view. This project is written for defenders: it links each risk to the weakness it exploits and to the control that fixes it, plus tests that confirm the fix. It cites ATLAS IDs as references; it does not extend or replace ATLAS.

## Sources

| Framework | Version used | How it appears |
|---|---|---|
| [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) | 2025 | `LLM01:2025` … `LLM10:2025` |
| [OWASP Top 10 for Agentic Applications](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) | 2026 (Dec 2025) | `ASI01:2026` … `ASI10:2026` |
| [MITRE ATLAS](https://atlas.mitre.org/) | 2026.09 data release | technique `AML.T…` and mitigation `AML.M…` IDs |
| [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) | 1.0 (AI 100-1) | subcategories such as `MEASURE 2.7` |

Each reference in the dataset stores its official code, name, and URL, and the app links to it. ATLAS IDs and names were checked against [`mitre-atlas/atlas-data`](https://github.com/mitre-atlas/atlas-data) `dist/v6/ATLAS-2026.09.yaml`.

## How severity is assigned

Severity follows the [OWASP Risk Rating Methodology](https://owasp.org/www-community/OWASP_Risk_Rating_Methodology). Each threat and vulnerability has an impact and a likelihood rating (High / Medium / Low) and a one-line rationale, stored in its `risk` field and shown in the app. The overall severity comes from the matrix:

| Impact ↓ / Likelihood → | Low | Medium | High |
|---|---|---|---|
| **High** | Medium | High | Critical |
| **Medium** | Low | Medium | High |
| **Low** | Low | Low | Medium |

A guardrail is labeled with the highest severity among the risks it directly mitigates (shown as "FOR CRITICAL" on its card). Ratings are the author's assessment for a typical production deployment; re-score them for your own environment.

`npm run build` runs [`scripts/validate-data.mjs`](scripts/validate-data.mjs), which fails if any severity disagrees with its scores, any framework ID is missing from the reference list, or any edge points to an unknown node.

## Domains

1. **Autonomous Agent & MCP Security**: tool hijacking, unbounded MCP calls, goal drift, prompt-to-code execution, manipulated human approvals, rogue agents → permission scoping, schema validation, dual-agent approval, hardened sandbox, verifiable approval previews, kill switch
2. **RAG & Knowledge Retrieval Security**: indirect injection, vector poisoning, document exfiltration, embedding inversion → pre-ingest scanning, document ACLs, output filtering, embedding protection
3. **Model Supply Chain & Training Integrity**: data poisoning, malicious model artifacts, model extraction, hallucinated package squatting, training data memorization → signed registry & AIBOM, safe artifact loading, dataset provenance, inference quotas, dependency allowlisting, PII scrubbing
4. **LLM Application & Output Security**: system prompt extraction, jailbreaks, output-rendered exfiltration, hallucinated answers, denial of wallet → output encoding & CSP, prompt hygiene, I/O classifiers, grounding & citation verification, uncertainty labeling & review, resource budgets
5. **Multi-Agent & Memory Trust**: memory poisoning, MCP tool poisoning, inter-agent impersonation, cascading failures → memory provenance, tool manifest pinning, agent workload identity, circuit breakers

Every item in the OWASP Top 10 for LLM Applications 2025 and the OWASP Top 10 for Agentic Applications 2026 has at least one threat and one guardrail.

## Using the site

- **Overview** is the start page: pick an area, or follow a guided path.
- **Map** shows how threats, vulnerabilities, and guardrails connect. Click a card to highlight its links; the detail panel lists related entries you can click through.
- **List** shows the same entries grouped by area and sorted by severity, which works better on phones.
- **Search** (⌘K / Ctrl K) accepts plain words or framework IDs (`LLM07`, `ASI06`, `AML.T0051`, `MEASURE 2.7`).
- **Copy checklist** on an area or at the end of a path exports its guardrails as Markdown.
- Sound effects are on by default and quiet; the speaker button in the header mutes them.

## Use the data

- **Dataset:** [`public/data/seed-data.json`](public/data/seed-data.json), also served at https://clarkngo.github.io/ai-sec-atlas/data/seed-data.json. It contains `meta`, `sources`, `references`, `domains`, `nodes`, and `edges`; the TypeScript schema is in [`src/types.ts`](src/types.ts).
- **Link to an entry:** use **Copy link** in any detail panel. Links keep the view and area (`#view=list&node=t-jailbreak`) or the path step (`#path=rag-chatbot&step=3`).
- **Cite:** see [`CITATION.cff`](CITATION.cff), or use **Cite this repository** on GitHub.

## Contribute

Open an issue to [suggest an entry or report a mapping error](https://github.com/clarkngo/ai-sec-atlas/issues/new/choose). New entries need at least one framework reference and, for threats and vulnerabilities, an impact × likelihood score with a rationale.

## Develop

```bash
npm install
npm run dev
```

```bash
npm run validate # check the dataset only
npm run build    # validate + typecheck + production build (base `/ai-sec-atlas/`)
npm run preview  # preview the production build locally
```

Stack: Vite, React, TypeScript, Tailwind CSS v4, [React Flow](https://reactflow.dev/), [Dagre](https://github.com/dagrejs/dagre), [Fuse.js](https://fusejs.io/).

## Deploy

Push to `main`. The [GitHub Actions workflow](.github/workflows/static.yml) builds `dist/` and deploys to GitHub Pages.

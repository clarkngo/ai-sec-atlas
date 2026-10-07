# AI Security Atlas

Interactive threat-modeling map for AI agents, LLMs, and RAG systems. Start at an adversarial vector, trace through underlying vulnerabilities, and land on concrete guardrails — with OWASP LLM Top 10 and MITRE ATLAS mappings.

**Live:** after enabling GitHub Pages, served at `https://<user>.github.io/ai-sec-atlas/`.

## Stack

- Vite + React + TypeScript + Tailwind CSS v4
- [React Flow](https://reactflow.dev/) (`@xyflow/react`) for the canvas
- [Dagre](https://github.com/dagrejs/dagre) for automatic DAG layout
- [Fuse.js](https://fusejs.io/) for fuzzy search across titles, frameworks, and summaries

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build    # typecheck + production build (base `/ai-sec-atlas/`)
npm run preview  # preview the production build locally
```

## Domains (seed)

1. **Autonomous Agent & MCP Security** — tool hijacking, unbounded MCP calls, goal drift → permission scoping, dual-agent approval, schema validation
2. **RAG & Knowledge Retrieval Security** — indirect injection, vector poisoning, document exfiltration → pre-ingest scanning, document ACLs, output filtering
3. **Model Supply Chain & Training Integrity** — data poisoning, malicious model artifacts, model extraction → signed registry & AIBOM, safe artifact loading, dataset provenance, inference quotas
4. **LLM Application & Output Security** — system prompt extraction, jailbreaks, output-rendered exfiltration → output encoding & CSP, prompt hygiene & canaries, I/O safety classifiers
5. **Multi-Agent & Memory Trust** — persistent memory poisoning, MCP tool description poisoning, inter-agent impersonation → memory provenance, tool manifest pinning, agent workload identity

Edit the threat database at [`public/data/seed-data.json`](public/data/seed-data.json).

## Deploy

Push to `main`. The [GitHub Actions workflow](.github/workflows/static.yml) builds `dist/` and deploys to GitHub Pages. In the repo settings, set Pages source to **GitHub Actions**.

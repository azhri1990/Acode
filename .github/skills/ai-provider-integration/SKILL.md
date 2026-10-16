---
name: ai-provider-integration
description: Use when connecting Acode AI features to an OpenAI-compatible endpoint, provider router, or local model server.
---

# AI provider integration

- Confirm the endpoint's supported API routes, authentication behavior, model IDs, streaming, and context limits.
- Treat provider credentials and router API keys as secrets; never commit, log, or expose them in sample configuration.
- Explain clearly which credentials belong to the router and which belong to upstream providers.
- Do not promise free or unlimited access; document current provider quotas, account requirements, terms, and model context limits.
- Prefer loopback, private LAN, HTTPS, or a trusted VPN; do not expose an unauthenticated inference endpoint publicly.
- Preserve user approval for AI-generated edits and commands, and test against a mock or local endpoint when possible.

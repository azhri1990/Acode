# AGENTS.md

Guidance for AI coding tools working on Acode (Cordova-based Android code editor).

## Setup
- `git submodule update --init` — required; `codemirror-lsp-client` is a git submodule and LSP code/tests fail to import without it.
- `npm install` — installs dependencies.
- Do not run `npm install` inside `codemirror-lsp-client/`; its own `node_modules` duplicates `@codemirror/state` and breaks tests.

## Commands
- `npm test` — Vitest unit tests (`tests/unit/**`).
- `npx biome check src tests` — lint and format check (`npm run check` also applies fixes).
- `npm run typecheck` — TypeScript check.
- `npm run build` — Android build; needs the Cordova/Android toolchain.

## Layout
- `src/sidebarApps/` — sidebar panels, registered in `src/sidebarApps/index.js` (`agora` AI panel, `git` panel).
- `src/lib/agora/` — OpenAI-compatible client, multi-agent orchestrator, voice, history helpers.
- `src/lib/git/` — git/gitflow operations run through the proot shell (`Executor.execute(cmd, true)`).
- `src/plugins/` — bundled Cordova plugins.
- `.github/skills/` — repository agent skills.

## Rules
- Never commit, log, or persist API keys or tokens (the Agora and Git panels keep them in memory only).
- AI-generated edits, pushes, and commands must require explicit user approval.
- Quote and validate anything interpolated into shell commands (see `src/lib/git/shell.js`).
- Do not add unreviewed third-party skills, MCP servers, or CLIs to the repository.

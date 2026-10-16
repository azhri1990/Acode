# Acode AI Agent with OmniRoute

This guide connects the official Acode AI Agent plugin to an OmniRoute server. OmniRoute can route requests across providers you configure; neither it nor the plugin supplies provider accounts, credits, or unlimited model access.

## Install the Acode plugin

1. In Acode, open **Settings → Plugins** and search for **Acode AI Agent**.
2. Install and enable the plugin published by [Acode Foundation](https://github.com/Acode-Foundation/acode-ai-agent).
3. Open a project folder, then open **AI Agent** from the sidebar or command palette.
4. Keep its permission mode on **Ask** while evaluating it. Review proposed edits and commands before approving them.

The plugin can edit project files. Its shell tool is available only for Terminal-backed folders. Acode's plugin store is separate from the Cordova plugins bundled into this repository's Android build.

## Run OmniRoute

Run OmniRoute on a computer or server reachable from the Android device. Follow its [official quick start](https://github.com/diegosouzapw/OmniRoute/blob/release/v3.8.52/docs/getting-started/QUICK-START.md); for example, the documented npm installation is:

```sh
npm install -g omniroute
omniroute
```

Open the dashboard at `http://localhost:20128`. In **Providers**, connect only providers whose current access requirements and terms you accept. A provider may require its own account, OAuth login, or API key; keyless access is not guaranteed. Use the [free-tier guide](https://github.com/diegosouzapw/OmniRoute/blob/release/v3.8.52/docs/getting-started/FREE-TIERS-GUIDE.md) to review current limits, privacy, and terms.

OmniRoute's `auto` route can select and fall back among eligible configured connections. It cannot route through providers that are unavailable, unconfigured, or excluded by routing policy. Provider quotas and individual model context limits still apply.

## Connect the Acode AI Agent

1. In OmniRoute's dashboard, create an API key under **Endpoints**. This key authenticates the Acode plugin to your OmniRoute server; it is not an upstream provider credential.
2. In the Acode AI Agent, open **Provider access → Local endpoint** and add an endpoint:
   - **Name:** `OmniRoute`
   - **Base URL:** `http://<server-LAN-address>:20128/v1`
   - **API key:** the key created in OmniRoute
3. Load models from `/models` if available. If `auto` is not listed, enter `auto` as the model ID manually. The plugin supports custom model IDs and OpenAI-compatible endpoints; OmniRoute documents an OpenAI-compatible `/v1` endpoint.
4. Select `auto` (or a specific model ID returned by OmniRoute) in the agent and send a small test prompt.

Replace `<server-LAN-address>` with the address of the computer running OmniRoute. On Android, `localhost` refers to the phone, not a separate computer. If both services run on the same phone, loopback may work depending on how OmniRoute is hosted.

Use a private trusted network for plain HTTP. For access beyond your private LAN, use HTTPS or a trusted private VPN, require authentication, and do not expose an unauthenticated OmniRoute endpoint to the public internet. Keep the OmniRoute key private; do not commit it to a project or paste it into shared prompts.

## Use local models without upstream credentials

For model inference that does not depend on hosted free-tier quotas, run a local model server such as Ollama on hardware that supports the model. You can either:

- Add the local OpenAI-compatible endpoint directly in **Provider access → Local endpoint**, or
- Connect that local server as a provider in OmniRoute, then use OmniRoute's endpoint as above.

Local inference avoids hosted-provider token quotas, but available model size, speed, context window, and concurrency are bounded by the machine's memory and compute. Confirm that the model server is reachable from the Android device and restrict it to a trusted network.

## Scope and limitations

- Acode AI Agent is a separately installed Acode plugin; it is not installed by this repository's Cordova setup.
- OmniRoute aggregates configured provider connections, not every provider or model on the internet. Catalogs, model IDs, provider terms, and quotas change.
- Free access may require sign-up, credentials, approval, or be limited by rate or usage quotas. Do not use placeholder credentials to bypass provider authentication or terms.
- Model IDs and compatibility vary. A route can fail if a provider does not support the requested model or API behavior.
- "Unlimited tokens" is not a feature this setup can guarantee. Hosted free tiers have provider limits, and each model has a finite context window. Local models still have hardware and context limits.
- The AI Agent may read and modify project files and, on Terminal-backed folders, run commands. Keep approval enabled and review changes.

## Coding-agent skills and agents

The [`.github/skills/`](../.github/skills/) directory contains a small set of repository-specific Agent Skills for Acode development, validation, Cordova plugin review, and AI provider integration. They are instructions, not a way to grant unlimited model usage.

For more task-specific skills and agent profiles, browse [GitHub's Awesome Copilot collection](https://github.com/github/awesome-copilot) and the [Agent Skills open standard](https://github.com/agentskills/agentskills). Install only the skills and agents you need, review their instructions and any scripts before use, and limit tool permissions for agents that can edit files or run commands.

---
name: cordova-plugin-review
description: Use when adding, changing, or reviewing Cordova plugins bundled with Acode.
---

# Cordova plugin review

- Verify the plugin source, license, maintenance status, and Android platform support before adding it.
- Review `plugin.xml`, native source, JavaScript entry points, hooks, permissions, and any install scripts.
- Request only permissions required for documented functionality; identify network, storage, and process access explicitly.
- Follow the repository's `src/plugins/` layout and existing package/config registration mechanisms.
- Keep Acode editor plugins distinct from Cordova plugins: the former run in Acode's plugin system and do not belong in Cordova setup.
- Test plugin installation and the relevant Android build when feasible; state any untested device behavior.

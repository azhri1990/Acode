---
name: acode-validation
description: Use when validating Acode changes, investigating test failures, or preparing a change for review.
---

# Acode validation

- Inspect the diff and run `git diff --check` before finalizing.
- Use existing repository scripts: `npm run test`, `npm run typecheck`, and `npx biome ci .` as applicable.
- Initialize declared submodules before interpreting missing-submodule import failures as code defects.
- For Android changes, use the documented Cordova setup/build only when the Android SDK and required network access are available.
- Distinguish failures caused by the change from environment, network, credentials, or pre-existing failures.
- Never claim a check passed unless its command completed successfully.

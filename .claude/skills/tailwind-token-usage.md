---
name: tailwind-token-usage
description: Scan for raw colors / shadows / magic numbers that should be tokens.
---

# Skill — tailwind token usage

1. Search for raw values outside the token files:
   ```bash
   rg -n "#[0-9a-fA-F]{3,8}" src --glob '!src/styles/**'
   rg -n "rgb(a)?\(" src --glob '!src/styles/**'
   rg -n "oklch\(" src --glob '!src/styles/**'
   rg -n "rem\)|px\)" src --glob '!src/styles/**'   # box-shadow magic
   ```
2. For each hit, propose either:
   - migrating to an existing token (preferred), or
   - adding a new token via `tailwind-theme-architect`.
3. Refuse "one-off" exceptions; if a value is used twice it
   needs a token.
4. Output a table: file:line · current · proposed token.

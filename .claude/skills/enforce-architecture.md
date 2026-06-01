---
name: enforce-architecture
description: Check the codebase against the layer rules and report violations.
---

# Skill — enforce architecture

1. Read `docs/01-architecture.md` §Layers.
2. Grep for forbidden import shapes:
   - `src/components/primitives/**` importing from `apps/`, `shell/`, or `effects/`.
   - `src/components/apps/**` importing other apps.
   - `src/lib/**` importing from `components/`.
3. For every violation, report:
   - file + line
   - rule broken
   - suggested fix (move file, invert dep, lift to shell).
4. If there are 0 violations, post "✅ layer rules clean".
5. Add detected anti-patterns to `docs/01-architecture.md` if
   they reflect a new gap.

# Agent Domain Docs

## Layout

Single-context.

This repo has one main product and engineering context. Agents should use the existing project docs instead of creating a second context system.

## Required Reading

Before planning or changing product behavior, read:

1. `docs/project-reference/README.md`
2. `docs/project-reference/project-overview.md`
3. `docs/project-reference/architecture.md`
4. `docs/project-reference/issues.md`
5. `docs/project-reference/measurement-skill.md`

For broad product direction, also read:

- `docs/product-strategy/reliable-finance-app-roadmap.md`

For architecture decisions, read:

- `docs/architecture/decisions/`

## Domain Language

Use the repo's reliability-first language:

- Prefer "reliable finance workflow" over broad clone features.
- Treat transaction snapshots, MMKV fallback, Worker sync, data freshness, runtime validation, and measurable customer impact as core product concepts.
- Do not present fake or placeholder finance actions as complete features.

If the product pivots toward the crypto market simulator direction, update this file and the project-reference docs so future sessions inherit the new language.

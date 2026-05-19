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

For pivot context, also read:

- `docs/project-reference/README.md`

For architecture decisions, read:

- `docs/architecture/decisions/`

## Domain Language

Use the repo's crypto simulator language:

- Prefer "crypto market simulator" over broad fintech clone features.
- Treat historical buy date, historical price, current value, simulated holdings, data freshness, runtime validation, and measurable customer impact as core product concepts.
- Do not present fake or placeholder banking, exchange, passcode, transaction, or portfolio actions as complete features.
- Old transaction snapshots, balance state, MMKV transaction persistence, and Activity ledger code were intentionally removed.

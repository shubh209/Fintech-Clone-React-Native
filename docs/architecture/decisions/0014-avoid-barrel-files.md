# Avoid Barrel Files

We will avoid `index.ts` barrel files during the restructure. Imports should point directly to descriptive files so a junior engineer can trace where behavior lives without jumping through re-export layers.

This may make imports slightly longer, but it preserves clarity while the project architecture is still being learned and shaped.

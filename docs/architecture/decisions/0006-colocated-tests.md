# Colocated Tests

Tests for a feature, screen, hook, validator, service function, or formatter should live beside the unit they verify. Root or top-level test folders should be reserved for cross-cutting repository structure checks and integration tests that genuinely span multiple domains.

This keeps learning and maintenance local: when a file changes, the closest relevant test should be easy to find.

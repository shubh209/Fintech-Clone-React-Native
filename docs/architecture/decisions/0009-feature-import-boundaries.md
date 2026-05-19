# Feature Import Boundaries

Frontend features may import from shared code, but should not import directly from other feature folders. If two features need the same code, that code should move to an appropriate shared area or cross-runtime contract package.

We will treat this as a documented convention first and add lint enforcement later after the folder structure stabilizes.

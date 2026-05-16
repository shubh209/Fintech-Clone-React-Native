import { existsSync } from 'fs';
import { join } from 'path';

describe('project structure', () => {
  it('keeps product code in explicit frontend and backend app folders', () => {
    const expectedDirectories = [
      'apps/frontend/app',
      'apps/frontend/Components',
      'apps/frontend/Store',
      'apps/frontend/utils',
      'apps/backend/src',
      'packages/shared/src',
    ];

    expectedDirectories.forEach((directory) => {
      expect(existsSync(join(process.cwd(), directory))).toBe(true);
    });
  });

  it('removes legacy root-level frontend and API folders', () => {
    const legacyDirectories = [
      'app',
      'Components',
      'Store',
      'utils',
      'apps/api',
    ];

    legacyDirectories.forEach((directory) => {
      expect(existsSync(join(process.cwd(), directory))).toBe(false);
    });
  });

  it('removes generated desktop metadata from tracked source folders', () => {
    expect(existsSync(join(process.cwd(), '.DS_Store'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'apps/frontend/assets/.DS_Store'))).toBe(false);
  });
});

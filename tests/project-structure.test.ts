import { existsSync } from 'fs';
import { join } from 'path';

describe('project structure', () => {
  it('keeps product code in explicit frontend and backend app folders', () => {
    const expectedDirectories = [
      'apps/frontend/app',
      'apps/frontend/src/features/auth',
      'apps/frontend/src/features/crypto-market',
      'apps/frontend/src/shared',
      'apps/backend/src',
      'apps/backend/src/domains/crypto-market',
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

  it('removes old fintech transaction surfaces for crypto simulator pivot', () => {
    const removedPaths = [
      'apps/frontend/app/(authenticated)/(tabs)/home.tsx',
      'apps/frontend/app/(authenticated)/(tabs)/activity.tsx',
      'apps/frontend/app/(authenticated)/(modals)/lock.tsx',
      'apps/frontend/Store/balance',
      'apps/frontend/utils/transactionApiClient.ts',
      'apps/frontend/utils/transactionRepository.ts',
      'apps/frontend/Components',
      'apps/frontend/constants',
      'apps/frontend/interfaces',
      'apps/frontend/utils',
      'apps/backend/src/transactions',
      'apps/backend/src/crypto',
      'packages/shared/src/transactionContracts.ts',
      'packages/shared/src/transactionContracts.test.ts',
    ];

    removedPaths.forEach((removedPath) => {
      expect(existsSync(join(process.cwd(), removedPath))).toBe(false);
    });
  });
});

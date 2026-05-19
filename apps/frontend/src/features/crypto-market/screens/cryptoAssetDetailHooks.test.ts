import { readFileSync } from 'fs';
import { join } from 'path';

describe('crypto detail hook ordering', () => {
  it('declares animated hooks before loading or error early returns', () => {
    const source = readFileSync(
      join(process.cwd(), 'apps/frontend/src/features/crypto-market/screens/cryptoAssetDetailScreen.tsx'),
      'utf8'
    );

    const animatedHookIndex = source.indexOf('const animatedPrice = useAnimatedProps');
    const loadingReturnIndex = source.indexOf('if (infoQuery.isLoading || tickersQuery.isLoading)');
    const errorReturnIndex = source.indexOf('if (infoQuery.isError || tickersQuery.isError');

    expect(animatedHookIndex).toBeGreaterThan(-1);
    expect(animatedHookIndex).toBeLessThan(loadingReturnIndex);
    expect(animatedHookIndex).toBeLessThan(errorReturnIndex);
  });
});

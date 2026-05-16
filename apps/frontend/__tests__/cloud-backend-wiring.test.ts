import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('cloud backend wiring', () => {
  it('removes mobile-owned crypto API handlers', () => {
    expect(existsSync(join(process.cwd(), 'apps/frontend/app/api/listings+api.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'apps/frontend/app/api/info+api.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'apps/frontend/app/api/tickers+api.ts'))).toBe(false);
  });

  it('splits backend crypto API responsibilities by file', () => {
    const files = [
      'apps/backend/src/index.ts',
      'apps/backend/src/crypto/cryptoRoutes.ts',
      'apps/backend/src/crypto/cryptoService.ts',
      'apps/backend/src/crypto/coinMarketCapClient.ts',
      'apps/backend/src/crypto/cloudFallbackStore.ts',
      'packages/shared/src/cryptoValidators.ts',
      'packages/shared/src/apiResult.ts',
    ];

    files.forEach((file) => {
      expect(existsSync(join(process.cwd(), file))).toBe(true);
    });
  });

  it('keeps mobile crypto screens on the cloud API client', () => {
    const listSource = readFileSync(
      join(process.cwd(), 'apps/frontend/app/(authenticated)/(tabs)/crypto.tsx'),
      'utf8'
    );
    const detailSource = readFileSync(
      join(process.cwd(), 'apps/frontend/app/(authenticated)/crypto/[id].tsx'),
      'utf8'
    );

    expect(listSource.includes('getCryptoApiUrl')).toBe(true);
    expect(detailSource.includes('getCryptoApiUrl')).toBe(true);
    expect(listSource.includes("process.env.CRYPTO_API_KEY")).toBe(false);
    expect(detailSource.includes("process.env.CRYPTO_API_KEY")).toBe(false);
  });
});

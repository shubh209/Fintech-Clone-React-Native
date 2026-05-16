import { readFileSync } from 'fs';
import { join } from 'path';

describe('crypto detail API wiring', () => {
  it('requests ticker data for the selected crypto id', () => {
    const source = readFileSync(
      join(process.cwd(), 'apps/frontend/app/(authenticated)/crypto/[id].tsx'),
      'utf8'
    );

    expect(source.includes('getCryptoApiUrl(`/api/tickers?id=${id}`)')).toBe(true);
    expect(source.includes("fetch('/api/tickers')")).toBe(false);
  });

  it('uses finance-relevant detail tabs instead of placeholder product tabs', () => {
    const source = readFileSync(
      join(process.cwd(), 'apps/frontend/app/(authenticated)/crypto/[id].tsx'),
      'utf8'
    );

    expect(source.includes("'Market'")).toBe(true);
    expect(source.includes("'About'")).toBe(true);
    expect(source.includes("'News'")).toBe(false);
    expect(source.includes("'Orders'")).toBe(false);
  });

  it('surfaces crypto detail data trust labels and retry copy', () => {
    const source = readFileSync(
      join(process.cwd(), 'apps/frontend/app/(authenticated)/crypto/[id].tsx'),
      'utf8'
    );

    expect(source.includes('Data source')).toBe(true);
    expect(source.includes('Last updated')).toBe(true);
    expect(source.includes('Retry')).toBe(true);
  });
});

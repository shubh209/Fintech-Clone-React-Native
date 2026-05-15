import { readFileSync } from 'fs';
import { join } from 'path';

describe('crypto list API wiring', () => {
  it('keeps the list price source tied to listings API data', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/(authenticated)/(tabs)/crypto.tsx'),
      'utf8'
    );

    expect(source.includes("fetch('/api/listings")).toBe(true);
    expect(source.includes('formatEuroPrice(currency.quote.EUR.price)')).toBe(true);
  });

  it('exposes a refresh action that refetches crypto APIs', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/(authenticated)/(tabs)/crypto.tsx'),
      'utf8'
    );

    expect(source.includes('const onRefreshPrices')).toBe(true);
    expect(source.includes('listingsQuery.refetch()')).toBe(true);
    expect(source.includes('infoQuery.refetch()')).toBe(true);
  });

  it('surfaces crypto data trust labels and retry copy', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/(authenticated)/(tabs)/crypto.tsx'),
      'utf8'
    );

    expect(source.includes('Data source')).toBe(true);
    expect(source.includes('Last updated')).toBe(true);
    expect(source.includes('Retry')).toBe(true);
  });
});

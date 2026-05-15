import {
  isCryptoListing,
  isCryptoInfoMap,
  normalizeQuoteTicker,
} from './cryptoValidators';

describe('crypto validators', () => {
  it('accepts a valid listing with EUR quote', () => {
    expect(
      isCryptoListing({
        id: 1,
        name: 'Bitcoin',
        symbol: 'BTC',
        quote: {
          EUR: {
            price: 100,
            percent_change_24h: 1,
            last_updated: '2026-05-14T15:00:00.000Z',
          },
        },
      })
    ).toBe(true);
  });

  it('rejects a listing without numeric price', () => {
    expect(
      isCryptoListing({
        id: 1,
        name: 'Bitcoin',
        symbol: 'BTC',
        quote: { EUR: { price: '100' } },
      })
    ).toBe(false);
  });

  it('accepts an info map with logos', () => {
    expect(
      isCryptoInfoMap({
        '1': { id: 1, name: 'Bitcoin', symbol: 'BTC', logo: 'https://example.test/btc.png' },
      })
    ).toBe(true);
  });

  it('normalizes latest quote payloads into ticker points', () => {
    expect(
      normalizeQuoteTicker({
        last_updated: '2026-05-14T15:00:00.000Z',
        quote: {
          EUR: {
            price: 100,
            volume_24h: 200,
            market_cap: 300,
            last_updated: '2026-05-14T15:01:00.000Z',
          },
        },
      })
    ).toEqual({
      timestamp: '2026-05-14T15:01:00.000Z',
      price: 100,
      volume_24h: 200,
      market_cap: 300,
    });
  });
});

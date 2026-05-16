import {
  createFallbackResult,
  createLiveResult,
  isApiResultStale,
} from './apiResult';

describe('api result metadata', () => {
  it('creates live result metadata with provider and timestamp', () => {
    expect(
      createLiveResult({ provider: 'coinmarketcap', updatedAt: '2026-05-14T15:00:00.000Z' })
    ).toEqual({
      source: 'live',
      provider: 'coinmarketcap',
      updatedAt: '2026-05-14T15:00:00.000Z',
      isFallback: false,
    });
  });

  it('creates fallback result metadata with reason', () => {
    expect(createFallbackResult({ reason: 'missing-api-key' })).toEqual({
      source: 'fallback',
      provider: 'local',
      updatedAt: null,
      reason: 'missing-api-key',
      isFallback: true,
    });
  });

  it('detects stale timestamps', () => {
    expect(
      isApiResultStale('2026-05-14T12:00:00.000Z', {
        nowMs: Date.parse('2026-05-14T12:02:01.000Z'),
        staleAfterMs: 120_000,
      })
    ).toBe(true);
  });
});

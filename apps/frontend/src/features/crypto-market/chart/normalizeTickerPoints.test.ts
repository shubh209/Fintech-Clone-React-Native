import { normalizeTickerPoints } from './normalizeTickerPoints';

describe('ticker utilities', () => {
  it('normalizes API timestamp strings to chart-friendly numbers', () => {
    const [point] = normalizeTickerPoints([
      {
        timestamp: '2024-01-01T00:00:00Z',
        price: 42850.26,
        volume_24h: 12058361624,
        market_cap: 839292148428,
      },
    ]);

    expect(point).toEqual({
      timestamp: Date.parse('2024-01-01T00:00:00Z'),
      price: 42850.26,
      volume_24h: 12058361624,
      market_cap: 839292148428,
    });
  });

  it('filters invalid ticker points', () => {
    expect(
      normalizeTickerPoints([
        { timestamp: 'not-a-date', price: 1 },
        { timestamp: '2024-01-01T00:00:00Z', price: Number.NaN },
      ])
    ).toEqual([]);
  });
});

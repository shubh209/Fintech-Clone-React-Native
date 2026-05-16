import { formatEuroPrice } from './currency';

describe('currency formatting', () => {
  it('formats crypto EUR prices with the euro symbol', () => {
    expect(formatEuroPrice(93478.435)).toBe('€93,478.44');
  });
});

import {
  purchasingPowerCities,
  purchasingPowerDatasetVersion,
  purchasingPowerItemsByCity,
} from './purchasingPowerData';

describe('purchasing power curated dataset', () => {
  it('contains the five starter cities for the demo flow', () => {
    expect(purchasingPowerDatasetVersion).toBe('2026-06-05.v1');
    expect(purchasingPowerCities.map((city) => city.id)).toEqual([
      'phoenix',
      'san_francisco',
      'new_york',
      'austin',
      'seattle',
    ]);
  });

  it('contains monthly essentials and big purchases for every city', () => {
    purchasingPowerCities.forEach((city) => {
      const items = purchasingPowerItemsByCity[city.id];
      expect(items.filter((item) => item.category === 'monthly_essentials')).toHaveLength(4);
      expect(items.filter((item) => item.category === 'big_purchase')).toHaveLength(3);
    });
  });

  it('uses positive costs and source labels for every comparison item', () => {
    Object.values(purchasingPowerItemsByCity).forEach((items) => {
      items.forEach((item) => {
        expect(item.costUsd).toBeGreaterThan(0);
        expect(item.sourceLabel).toContain('curated');
      });
    });
  });
});

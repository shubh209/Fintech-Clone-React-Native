import { SimulationAssetCatalogItem } from '@shared/simulationAssetCatalogTypes';
import { getSelectedAssetAvailability } from './simulationAssetSupport';

function asset(
  overrides: Partial<SimulationAssetCatalogItem>
): SimulationAssetCatalogItem {
  return {
    assetId: 'binancecoin',
    symbol: 'BNB',
    name: 'binancecoin',
    category: 'Exchange',
    status: 'ready',
    historical: {
      firstDate: '2017-11-09',
      lastDate: '2026-03-22',
      rowCount: 3055,
      missingDateCount: 0,
      largestGapDays: 0,
    },
    dataQuality: {
      repairedRowCount: 0,
      quarantinedRowCount: 0,
      eligibleRowCount: 3055,
      quarantineRate: 0,
      status: 'clean',
    },
    market: {
      coinGeckoId: 'binancecoin',
      rank: 4,
      imageUrl: null,
      currentPriceUsd: null,
      priceChangePercentage24h: null,
      updatedAt: null,
      status: 'unavailable',
    },
    availability: {
      canSimulate: false,
      reason: 'Current market price is unavailable.',
      detail: 'CoinGecko did not return a positive current USD price for binancecoin.',
    },
    ...overrides,
  };
}

describe('getSelectedAssetAvailability', () => {
  it('allows ready assets even when catalog market enrichment is unavailable', () => {
    expect(getSelectedAssetAvailability(asset({}))).toEqual({
      canSimulate: true,
      reason: null,
      detail: null,
    });
  });

  it('allows ready assets outside the former top-20 simulation scope', () => {
    expect(
      getSelectedAssetAvailability(
        asset({
          assetId: 'aave',
          symbol: 'AAVE',
          name: 'aave',
        })
      )
    ).toEqual({
      canSimulate: true,
      reason: null,
      detail: null,
    });
  });

  it('blocks non-ready database assets', () => {
    expect(
      getSelectedAssetAvailability(
        asset({
          assetId: 'bad',
          symbol: 'BAD',
          name: 'bad',
          status: 'historical_invalid',
          availability: {
            canSimulate: false,
            reason: 'Historical data needs validation.',
            detail: 'BAD has invalid historical rows.',
          },
        })
      )
    ).toEqual({
      canSimulate: false,
      reason: 'Historical data needs validation.',
      detail: 'BAD has invalid historical rows.',
    });
  });
});

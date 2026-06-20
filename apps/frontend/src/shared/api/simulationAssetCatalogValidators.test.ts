import {
  isSimulationAssetCatalogResponse,
  isSimulationAssetCatalogItem,
} from '@/shared/api/simulationAssetCatalogValidators';

const readyAsset = {
  assetId: 'bitcoin',
  symbol: 'BTC',
  name: 'Bitcoin',
  category: 'Layer 1',
  status: 'ready',
  historical: {
    firstDate: '2021-01-01',
    lastDate: '2026-03-22',
    rowCount: 1906,
    missingDateCount: 1,
    largestGapDays: 2,
  },
  dataQuality: {
    repairedRowCount: 1,
    quarantinedRowCount: 2,
    eligibleRowCount: 1908,
    quarantineRate: 0.001,
    status: 'repaired_and_quarantined',
  },
  market: {
    coinGeckoId: 'bitcoin',
    rank: 1,
    imageUrl: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    currentPriceUsd: 77000,
    priceChangePercentage24h: -1.5,
    updatedAt: '2026-05-26T00:00:00.000Z',
    status: 'fresh',
  },
  availability: {
    canSimulate: true,
    reason: null,
    detail: null,
  },
};

describe('simulation asset catalog validators', () => {
  it('accepts a ready catalog item', () => {
    expect(isSimulationAssetCatalogItem(readyAsset)).toBe(true);
  });

  it('accepts split ready and unavailable asset lists', () => {
    expect(
      isSimulationAssetCatalogResponse({
        status: 'success',
        assets: {
          ready: [readyAsset],
          unavailable: [
            {
              ...readyAsset,
              assetId: 'sui',
              symbol: 'SUI',
              name: 'sui',
              status: 'historical_invalid',
              market: {
                ...readyAsset.market,
                coinGeckoId: null,
                rank: null,
                imageUrl: null,
                currentPriceUsd: null,
                priceChangePercentage24h: null,
                updatedAt: null,
                status: 'unavailable',
              },
              availability: {
                canSimulate: false,
                reason: 'Historical data needs validation.',
                detail: 'SUI has non-positive OHLC values',
              },
            },
          ],
        },
        source: {
          historicalProvider: 'historical_csv',
          marketProvider: 'coingecko',
          importedAt: '2026-05-22T21:42:05.428Z',
          marketDataUpdatedAt: '2026-05-26T00:00:00.000Z',
          marketCacheStatus: 'fresh',
        },
      })
    ).toBe(true);
  });

  it('rejects invalid status and negative current price', () => {
    expect(
      isSimulationAssetCatalogItem({
        ...readyAsset,
        status: 'enabled',
      })
    ).toBe(false);

    expect(
      isSimulationAssetCatalogItem({
        ...readyAsset,
        market: { ...readyAsset.market, currentPriceUsd: -1 },
      })
    ).toBe(false);
  });

  it('rejects invalid data-quality metadata', () => {
    expect(
      isSimulationAssetCatalogItem({
        ...readyAsset,
        dataQuality: { ...readyAsset.dataQuality, quarantineRate: 'bad' },
      })
    ).toBe(false);

    expect(
      isSimulationAssetCatalogItem({
        ...readyAsset,
        dataQuality: { ...readyAsset.dataQuality, status: 'unknown' },
      })
    ).toBe(false);
  });
});

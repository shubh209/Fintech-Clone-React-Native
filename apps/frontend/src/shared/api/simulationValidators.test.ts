import {
  isSimulationHistoryResponse,
  isSimulationPriceErrorResponse,
  isSimulationPriceResponse,
  isSimulationPriceSuccessResponse,
  isSimulationPriceUnavailableResponse,
} from './simulationValidators';

const successResponse = {
  status: 'success',
  asset: {
    symbol: 'BTC',
    name: 'Bitcoin',
    coinGeckoId: 'bitcoin',
  },
  input: {
    requestedDate: '2021-01-01',
    amountUsd: 100,
  },
  historical: {
    requestedDate: '2021-01-01',
    resolvedDate: '2021-01-03',
    dateResolution: 'next_available',
    priceUsd: 29374.15,
    source: {
      source: 'fallback',
      provider: 'historical_csv',
      updatedAt: '2026-05-22T00:00:00.000Z',
      reason: 'curated historical dataset',
      isFallback: true,
    },
  },
  current: {
    priceUsd: 108000.25,
    source: {
      source: 'live',
      provider: 'coingecko',
      updatedAt: '2026-05-22T17:30:00.000Z',
      isFallback: false,
    },
    cache: {
      status: 'fresh',
      ttlSeconds: 60,
    },
  },
  result: {
    impliedQuantity: 0.003404,
    currentValueUsd: 367.63,
    gainLossUsd: 267.63,
    gainLossPercent: 267.63,
  },
};

describe('simulation price validators', () => {
  it('accepts a valid successful simulation price response', () => {
    expect(isSimulationPriceSuccessResponse(successResponse)).toBe(true);
    expect(isSimulationPriceResponse(successResponse)).toBe(true);
  });

  it('rejects unsupported product asset symbols', () => {
    expect(
      isSimulationPriceSuccessResponse({
        ...successResponse,
        asset: { ...successResponse.asset, symbol: 'DOGE' },
      })
    ).toBe(false);
  });

  it('rejects invalid price values', () => {
    expect(
      isSimulationPriceSuccessResponse({
        ...successResponse,
        current: { ...successResponse.current, priceUsd: 0 },
      })
    ).toBe(false);
  });

  it('accepts validation error responses', () => {
    expect(
      isSimulationPriceErrorResponse({
        status: 'error',
        code: 'unsupported_asset',
        message: 'Simulation v1 supports BTC, ETH, and SOL.',
      })
    ).toBe(true);
  });

  it('accepts unavailable responses', () => {
    expect(
      isSimulationPriceUnavailableResponse({
        status: 'unavailable',
        code: 'current_price_unavailable',
        message: 'Current USD price is unavailable. Try again soon.',
        details: { asset: 'BTC', requestedDate: '2021-01-01' },
      })
    ).toBe(true);
  });
});

const historyResponse = {
  status: 'success',
  asset: {
    symbol: 'BTC',
    name: 'Bitcoin',
    coinGeckoId: 'bitcoin',
  },
  range: {
    year: 2021,
    startDate: '2021-01-01',
    endDate: '2021-12-31',
  },
  points: [
    { date: '2021-01-01', priceUsd: 29374.15 },
    { date: '2021-02-01', priceUsd: 33537.17 },
  ],
  source: {
    source: 'fallback',
    provider: 'historical_csv',
    updatedAt: '2026-05-22T00:00:00.000Z',
    reason: 'curated historical dataset',
    isFallback: true,
  },
};

describe('simulation history validators', () => {
  it('accepts valid yearly history responses', () => {
    expect(isSimulationHistoryResponse(historyResponse)).toBe(true);
  });

  it('rejects non-positive historical chart prices', () => {
    expect(
      isSimulationHistoryResponse({
        ...historyResponse,
        points: [{ date: '2021-01-01', priceUsd: 0 }],
      })
    ).toBe(false);
  });
});

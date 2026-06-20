import {
  isSimulationEventListResponse,
  isSimulationEventScenarioResponse,
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

  it('rejects malformed asset symbols', () => {
    expect(
      isSimulationPriceSuccessResponse({
        ...successResponse,
        asset: { ...successResponse.asset, symbol: '' },
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

const eventSources = [
  {
    title: 'Bitcoin ETF demand lifts market',
    publisher: 'Example Markets',
    url: 'https://example.com/bitcoin-etf-demand',
    publishedAt: '2021-02-08T12:00:00.000Z',
  },
  {
    title: 'Institutions add Bitcoin exposure',
    publisher: 'Example Wire',
    url: 'https://example.com/institutions-bitcoin',
    publishedAt: null,
  },
];

const eventSummary = {
  id: 'btc-2021-etf-demand',
  assetSymbol: 'BTC',
  headline: 'ETF demand changes Bitcoin expectations',
  summary: 'Institutional demand shifted near-term expectations for Bitcoin.',
  eventDate: '2021-02-08',
  category: 'adoption',
  marketSentiment: 'positive',
  sortOrder: 10,
  sources: eventSources,
};

const eventScenarioEvent = {
  id: 'btc-2021-etf-demand',
  assetSymbol: 'BTC',
  headline: 'ETF demand changes Bitcoin expectations',
  summary: 'Institutional demand shifted near-term expectations for Bitcoin.',
  eventDate: '2021-02-08',
  category: 'adoption',
  marketSentiment: 'positive',
  sources: eventSources,
};

const eventListResponse = {
  status: 'success',
  asset: {
    symbol: 'BTC',
    name: 'Bitcoin',
    coinGeckoId: 'bitcoin',
  },
  supportedDelays: ['same_day', 'one_week', 'one_month'],
  events: [eventSummary],
};

describe('simulation event validators', () => {
  it('accepts sourced event list responses with feed sort order', () => {
    expect(isSimulationEventListResponse(eventListResponse)).toBe(true);
  });

  it('rejects event summaries with fewer than two sources', () => {
    expect(
      isSimulationEventListResponse({
        ...eventListResponse,
        events: [{ ...eventSummary, sources: [eventSources[0]] }],
      })
    ).toBe(false);
  });

  it('rejects event summaries with invalid category or sentiment values', () => {
    expect(
      isSimulationEventListResponse({
        ...eventListResponse,
        events: [{ ...eventSummary, category: 'macro' }],
      })
    ).toBe(false);
    expect(
      isSimulationEventListResponse({
        ...eventListResponse,
        events: [{ ...eventSummary, marketSentiment: 'bullish' }],
      })
    ).toBe(false);
  });

  it('accepts event scenario responses with risk metrics', () => {
    expect(
      isSimulationEventScenarioResponse({
        ...successResponse,
        event: eventScenarioEvent,
        input: {
          ...successResponse.input,
          delay: 'one_week',
          intendedBuyDate: '2021-02-15',
        },
        risk: {
          maxDrawdownPercent: -30.5,
          longestUnderwaterDays: 180,
          bestThirtyDayReturnPercent: 42.3,
          worstThirtyDayReturnPercent: -18.2,
          startDate: '2021-02-15',
          endDate: '2022-02-15',
        },
        takeaway: 'Waiting one week changed the simulation risk profile.',
      })
    ).toBe(true);
  });

  it('rejects event scenario responses with feed-only sort order on the nested event', () => {
    expect(
      isSimulationEventScenarioResponse({
        ...successResponse,
        event: eventSummary,
        input: {
          ...successResponse.input,
          delay: 'one_week',
          intendedBuyDate: '2021-02-15',
        },
        risk: {
          maxDrawdownPercent: -30.5,
          longestUnderwaterDays: 180,
          bestThirtyDayReturnPercent: 42.3,
          worstThirtyDayReturnPercent: -18.2,
          startDate: '2021-02-15',
          endDate: '2022-02-15',
        },
        takeaway: 'Waiting one week changed the simulation risk profile.',
      })
    ).toBe(false);
  });

  it('rejects event scenario responses with malformed risk metrics or invalid delay', () => {
    const scenarioResponse = {
      ...successResponse,
      event: eventScenarioEvent,
      input: {
        ...successResponse.input,
        delay: 'one_week',
        intendedBuyDate: '2021-02-15',
      },
      risk: {
        maxDrawdownPercent: -30.5,
        longestUnderwaterDays: 180,
        bestThirtyDayReturnPercent: 42.3,
        worstThirtyDayReturnPercent: -18.2,
        startDate: '2021-02-15',
        endDate: '2022-02-15',
      },
      takeaway: 'Waiting one week changed the simulation risk profile.',
    };

    expect(
      isSimulationEventScenarioResponse({
        ...scenarioResponse,
        risk: { ...scenarioResponse.risk, maxDrawdownPercent: 'large' },
      })
    ).toBe(false);
    expect(
      isSimulationEventScenarioResponse({
        ...scenarioResponse,
        risk: { ...scenarioResponse.risk, bestThirtyDayReturnPercent: Infinity },
      })
    ).toBe(false);
    expect(
      isSimulationEventScenarioResponse({
        ...scenarioResponse,
        risk: { ...scenarioResponse.risk, worstThirtyDayReturnPercent: NaN },
      })
    ).toBe(false);
    expect(
      isSimulationEventScenarioResponse({
        ...scenarioResponse,
        input: { ...scenarioResponse.input, delay: 'two_weeks' },
      })
    ).toBe(false);
  });
});

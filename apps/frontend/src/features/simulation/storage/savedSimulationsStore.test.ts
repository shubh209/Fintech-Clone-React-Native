import { readFileSync } from 'fs';
import { join } from 'path';

import { SimulationPriceSuccessResponse } from '@shared/simulationTypes';

const result: SimulationPriceSuccessResponse = {
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
    resolvedDate: '2021-01-01',
    dateResolution: 'exact',
    priceUsd: 29374.15,
    source: {
      source: 'live',
      provider: 'Cloudflare D1 historical_crypto_prices',
      updatedAt: '2026-05-22T00:00:00.000Z',
      isFallback: false,
    },
  },
  current: {
    priceUsd: 108000,
    source: {
      source: 'live',
      provider: 'CoinGecko Simple Price',
      updatedAt: '2026-05-23T00:00:00.000Z',
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

function createMemoryAdapter(seed: Record<string, string | null> = {}) {
  const values = { ...seed };

  return {
    values,
    adapter: {
      getItemAsync: async (key: string) => values[key] ?? null,
      setItemAsync: async (key: string, value: string) => {
        values[key] = value;
      },
    },
  };
}

describe('savedSimulationsStore', () => {
  it('saves a hypothetical simulation snapshot with local identity and data trust metadata', async () => {
    const { createSavedSimulationsStore } = require('./savedSimulationsStore');
    const memory = createMemoryAdapter();
    const store = createSavedSimulationsStore({
      storage: memory.adapter,
      createId: () => 'sim_local_1',
      now: () => new Date('2026-05-23T12:00:00.000Z'),
    });

    const saved = await store.saveSimulation({
      input: {
        asset: 'BTC',
        requestedDate: '2021-01-01',
        amountUsd: 100,
      },
      result,
    });

    expect(saved.id).toBe('sim_local_1');
    expect(saved.createdAt).toBe('2026-05-23T12:00:00.000Z');
    expect(saved.hypotheticalLabel).toBe('Hypothetical simulation');
    expect(saved.input).toEqual({
      asset: 'BTC',
      requestedDate: '2021-01-01',
      amountUsd: 100,
    });
    expect(saved.dataTrust).toEqual({
      historicalProvider: 'Cloudflare D1 historical_crypto_prices',
      historicalDateResolution: 'exact',
      currentProvider: 'CoinGecko Simple Price',
      currentCacheStatus: 'fresh',
    });
    expect(saved.resultSnapshot).toEqual(result);
    expect(await store.listSavedSimulations()).toEqual([saved]);
  });

  it('loads saved simulations from the local storage adapter', async () => {
    const { createSavedSimulationsStore } = require('./savedSimulationsStore');
    const memory = createMemoryAdapter();
    const firstStore = createSavedSimulationsStore({
      storage: memory.adapter,
      createId: () => 'sim_local_1',
      now: () => new Date('2026-05-23T12:00:00.000Z'),
    });

    const saved = await firstStore.saveSimulation({
      input: {
        asset: 'BTC',
        requestedDate: '2021-01-01',
        amountUsd: 100,
      },
      result,
    });

    const secondStore = createSavedSimulationsStore({
      storage: createMemoryAdapter(memory.values).adapter,
    });

    expect(await secondStore.listSavedSimulations()).toEqual([saved]);
  });

  it('saves event metadata for event-based simulations', async () => {
    const { createSavedSimulationsStore } = require('./savedSimulationsStore');
    const memory = createMemoryAdapter();
    const store = createSavedSimulationsStore({
      storage: memory.adapter,
      createId: () => 'sim_event_1',
      now: () => new Date('2026-05-23T12:00:00.000Z'),
    });

    const saved = await store.saveSimulation({
      input: {
        asset: 'BTC',
        requestedDate: '2024-01-17',
        amountUsd: 100,
        scenarioType: 'event',
        event: {
          id: 'btc-2024-spot-etf-approval',
          headline: 'U.S. spot Bitcoin ETFs are approved',
          eventDate: '2024-01-10',
          delay: 'one_week',
        },
      },
      result,
    });

    expect(saved.input.scenarioType).toBe('event');
    expect(saved.input.event).toEqual({
      id: 'btc-2024-spot-etf-approval',
      headline: 'U.S. spot Bitcoin ETFs are approved',
      eventDate: '2024-01-10',
      delay: 'one_week',
    });
  });

  it('keeps saved simulation storage language away from trading products', () => {
    const source = readFileSync(
      join(
        process.cwd(),
        'apps/frontend/src/features/simulation/storage/savedSimulationsStore.ts'
      ),
      'utf8'
    ).toLowerCase();

    expect(source.includes('transaction')).toBe(false);
    expect(source.includes('holding')).toBe(false);
    expect(source.includes('order')).toBe(false);
  });
});

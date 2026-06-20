import {
  getSimulationEventById,
  listSimulationEvents,
} from '../../src/domains/simulation/simulationEventRepository';
import { SqlDatabase } from '../../src/types';

function fakeDb({
  eventRows,
  sourceRows,
}: {
  eventRows: Array<Record<string, unknown>>;
  sourceRows: Array<Record<string, unknown>>;
}) {
  const calls: Array<{ query: string; values: unknown[] }> = [];
  const db = {
    prepare: (query: string) => ({
      bind: (...values: unknown[]) => {
        calls.push({ query, values });
        return {
          first: async () => {
            const [eventId] = values;
            return (
              eventRows.find((row) => row.id === eventId && row.status === 'active') ?? null
            );
          },
          all: async () => {
            if (query.includes('FROM simulation_events')) {
              const [assetSymbol] = values;
              return {
                results: eventRows
                  .filter((row) => row.asset_symbol === assetSymbol && row.status === 'active')
                  .sort((left, right) => {
                    const sortOrder = Number(left.sort_order) - Number(right.sort_order);
                    return sortOrder || String(left.event_date).localeCompare(String(right.event_date));
                  }),
              };
            }

            if (query.includes('FROM simulation_event_sources')) {
              const [eventId] = values;
              return {
                results: sourceRows
                  .filter((row) => row.event_id === eventId)
                  .sort((left, right) => String(left.id).localeCompare(String(right.id))),
              };
            }

            return { results: [] };
          },
          run: async () => ({}),
          bind: () => {
            throw new Error('nested bind not used');
          },
        };
      },
      first: async () => null,
      all: async () => ({ results: [] }),
      run: async () => ({}),
    }),
  } as unknown as SqlDatabase;

  return { db, calls };
}

const btcHalvingEventRow = {
  id: 'btc-2020-halving',
  asset_symbol: 'BTC',
  headline: 'Bitcoin completes its third halving',
  summary: 'Bitcoin mining rewards fell from 12.5 BTC to 6.25 BTC.',
  event_date: '2020-05-11',
  category: 'protocol_upgrade',
  market_sentiment: 'mixed',
  sort_order: 1,
  status: 'active',
};

const inactiveBtcEventRow = {
  id: 'btc-inactive',
  asset_symbol: 'BTC',
  headline: 'Inactive Bitcoin event',
  summary: 'This event should not be returned.',
  event_date: '2020-01-01',
  category: 'adoption',
  market_sentiment: 'positive',
  sort_order: 0,
  status: 'inactive',
};

const btcSourceRows = [
  {
    id: 'source-a',
    event_id: 'btc-2020-halving',
    title: 'Bitcoin third halving complete',
    publisher: 'CoinDesk',
    url: 'https://example.com/coindesk',
    published_at: '2020-05-11',
  },
  {
    id: 'source-b',
    event_id: 'btc-2020-halving',
    title: 'Bitcoin halving keeps cryptocurrency a speculative bet',
    publisher: 'Reuters',
    url: 'https://example.com/reuters',
    published_at: null,
  },
];

describe('simulation event repository', () => {
  it('lists active sourced BTC events with sources attached', async () => {
    const { db, calls } = fakeDb({
      eventRows: [btcHalvingEventRow],
      sourceRows: btcSourceRows,
    });

    const result = await listSimulationEvents({ db, assetSymbol: 'BTC' });

    expect(calls[0].query).toContain('FROM simulation_events');
    expect(calls[0].query).toContain("WHERE asset_symbol = ?");
    expect(calls[0].query).toContain("status = 'active'");
    expect(calls[0].query).toContain('ORDER BY sort_order ASC, event_date ASC');
    expect(calls[1].query).toContain('FROM simulation_event_sources');
    expect(calls[1].query).toContain('ORDER BY id ASC');
    expect(result).toEqual([
      {
        id: 'btc-2020-halving',
        assetSymbol: 'BTC',
        headline: 'Bitcoin completes its third halving',
        summary: 'Bitcoin mining rewards fell from 12.5 BTC to 6.25 BTC.',
        eventDate: '2020-05-11',
        category: 'protocol_upgrade',
        marketSentiment: 'mixed',
        sortOrder: 1,
        sources: [
          {
            title: 'Bitcoin third halving complete',
            publisher: 'CoinDesk',
            url: 'https://example.com/coindesk',
            publishedAt: '2020-05-11',
          },
          {
            title: 'Bitcoin halving keeps cryptocurrency a speculative bet',
            publisher: 'Reuters',
            url: 'https://example.com/reuters',
            publishedAt: null,
          },
        ],
      },
    ]);
  });

  it('gets an active sourced event by id', async () => {
    const { db, calls } = fakeDb({
      eventRows: [btcHalvingEventRow],
      sourceRows: btcSourceRows,
    });

    const result = await getSimulationEventById({
      db,
      eventId: 'btc-2020-halving',
    });

    expect(calls[0].query).toContain('FROM simulation_events');
    expect(calls[0].query).toContain('WHERE id = ?');
    expect(calls[0].query).toContain("status = 'active'");
    expect(calls[0].query).toContain('LIMIT 1');
    expect(calls[0].values).toEqual(['btc-2020-halving']);
    expect(result?.id).toBe('btc-2020-halving');
    expect(result?.sources).toHaveLength(2);
  });

  it('filters out events with fewer than two sources', async () => {
    const { db } = fakeDb({
      eventRows: [btcHalvingEventRow],
      sourceRows: [btcSourceRows[0]],
    });

    const listResult = await listSimulationEvents({ db, assetSymbol: 'BTC' });
    const getResult = await getSimulationEventById({
      db,
      eventId: 'btc-2020-halving',
    });

    expect(listResult).toEqual([]);
    expect(getResult).toBe(null);
  });

  it('does not return inactive events', async () => {
    const { db } = fakeDb({
      eventRows: [btcHalvingEventRow, inactiveBtcEventRow],
      sourceRows: [
        ...btcSourceRows,
        { ...btcSourceRows[0], id: 'inactive-source-a', event_id: 'btc-inactive' },
        { ...btcSourceRows[1], id: 'inactive-source-b', event_id: 'btc-inactive' },
      ],
    });

    const listResult = await listSimulationEvents({ db, assetSymbol: 'BTC' });
    const getResult = await getSimulationEventById({ db, eventId: 'btc-inactive' });

    expect(listResult.map((event) => event.id)).toEqual(['btc-2020-halving']);
    expect(getResult).toBe(null);
  });
});

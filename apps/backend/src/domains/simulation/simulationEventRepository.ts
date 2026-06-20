import type {
  SimulationAssetSymbol,
  SimulationEventCategory,
  SimulationEventMarketSentiment,
  SimulationEventSource,
  SimulationEventSummary,
} from '../../../../../packages/shared/src';
import type { SqlDatabase } from '../../types';

interface SimulationEventRow {
  id: string;
  asset_symbol: SimulationAssetSymbol;
  headline: string;
  summary: string;
  event_date: string;
  category: SimulationEventCategory;
  market_sentiment: SimulationEventMarketSentiment;
  sort_order: number;
}

interface SimulationEventSourceRow {
  title: string;
  publisher: string;
  url: string;
  published_at: string | null;
}

function mapSourceRow(row: SimulationEventSourceRow): SimulationEventSource {
  return {
    title: row.title,
    publisher: row.publisher,
    url: row.url,
    publishedAt: row.published_at,
  };
}

function mapEventRow({
  row,
  sources,
}: {
  row: SimulationEventRow;
  sources: SimulationEventSource[];
}): SimulationEventSummary {
  return {
    id: row.id,
    assetSymbol: row.asset_symbol,
    headline: row.headline,
    summary: row.summary,
    eventDate: row.event_date,
    category: row.category,
    marketSentiment: row.market_sentiment,
    sortOrder: row.sort_order,
    sources,
  };
}

async function listSourcesForEvent({
  db,
  eventId,
}: {
  db: SqlDatabase;
  eventId: string;
}): Promise<SimulationEventSource[]> {
  const rows = await db
    .prepare(
      `SELECT title, publisher, url, published_at
       FROM simulation_event_sources
       WHERE event_id = ?
       ORDER BY id ASC`
    )
    .bind(eventId)
    .all<SimulationEventSourceRow>();

  return rows.results.map(mapSourceRow);
}

async function mapSourcedEvent({
  db,
  row,
}: {
  db: SqlDatabase;
  row: SimulationEventRow;
}): Promise<SimulationEventSummary | null> {
  const sources = await listSourcesForEvent({ db, eventId: row.id });
  if (sources.length < 2) return null;

  return mapEventRow({ row, sources });
}

export async function listSimulationEvents({
  db,
  assetSymbol,
}: {
  db: SqlDatabase;
  assetSymbol: SimulationAssetSymbol;
}): Promise<SimulationEventSummary[]> {
  const rows = await db
    .prepare(
      `SELECT id, asset_symbol, headline, summary, event_date, category, market_sentiment, sort_order
       FROM simulation_events
       WHERE asset_symbol = ?
         AND status = 'active'
       ORDER BY sort_order ASC, event_date ASC`
    )
    .bind(assetSymbol)
    .all<SimulationEventRow>();

  const events = await Promise.all(rows.results.map((row) => mapSourcedEvent({ db, row })));
  return events.filter((event): event is SimulationEventSummary => event !== null);
}

export async function getSimulationEventById({
  db,
  eventId,
}: {
  db: SqlDatabase;
  eventId: string;
}): Promise<SimulationEventSummary | null> {
  const row = await db
    .prepare(
      `SELECT id, asset_symbol, headline, summary, event_date, category, market_sentiment, sort_order
       FROM simulation_events
       WHERE id = ?
         AND status = 'active'
       LIMIT 1`
    )
    .bind(eventId)
    .first<SimulationEventRow>();

  if (!row) return null;

  return mapSourcedEvent({ db, row });
}

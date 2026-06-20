import { ApiResultMetadata } from './apiResult';

export type SimulationAssetSymbol = 'BTC' | 'ETH' | 'SOL';
export type SimulationDateResolution = 'exact' | 'next_available';
export type SimulationCurrentCacheStatus = 'fresh' | 'refreshed';
export type SimulationHistoricalDataQualityStatus = 'exact' | 'resolved_to_next_available';
export type SimulationEventDelay = 'same_day' | 'one_week' | 'one_month';
export type SimulationEventCategory =
  | 'adoption'
  | 'regulation'
  | 'crash'
  | 'exchange_failure'
  | 'protocol_upgrade'
  | 'ecosystem';
export type SimulationEventMarketSentiment = 'positive' | 'negative' | 'mixed';

export type SimulationValidationErrorCode =
  | 'missing_asset'
  | 'unsupported_asset'
  | 'missing_date'
  | 'invalid_date'
  | 'date_out_of_range'
  | 'missing_amount'
  | 'invalid_amount'
  | 'missing_event'
  | 'missing_delay'
  | 'invalid_delay';

export type SimulationUnavailableCode =
  | 'historical_price_unavailable'
  | 'current_price_unavailable'
  | 'simulation_price_unavailable';

export interface SimulationPriceSuccessResponse {
  status: 'success';
  asset: {
    symbol: SimulationAssetSymbol;
    name: string;
    coinGeckoId: string;
  };
  input: {
    requestedDate: string;
    amountUsd: number;
  };
  historical: {
    requestedDate: string;
    resolvedDate: string;
    dateResolution: SimulationDateResolution;
    priceUsd: number;
    source: ApiResultMetadata;
    dataQuality?: {
      status: SimulationHistoricalDataQualityStatus;
      message: string;
    };
  };
  current: {
    priceUsd: number;
    source: ApiResultMetadata;
    cache: {
      status: SimulationCurrentCacheStatus;
      ttlSeconds: number;
    };
  };
  result: {
    impliedQuantity: number;
    currentValueUsd: number;
    gainLossUsd: number;
    gainLossPercent: number;
  };
}

export interface SimulationPriceErrorResponse {
  status: 'error';
  code: SimulationValidationErrorCode;
  message: string;
}

export interface SimulationPriceUnavailableResponse {
  status: 'unavailable';
  code: SimulationUnavailableCode;
  message: string;
  details?: {
    asset?: string;
    requestedDate?: string;
  };
}

export type SimulationPriceResponse =
  | SimulationPriceSuccessResponse
  | SimulationPriceErrorResponse
  | SimulationPriceUnavailableResponse;

export interface SimulationEventSource {
  title: string;
  publisher: string;
  url: string;
  publishedAt: string | null;
}

export interface SimulationEventSummary {
  id: string;
  assetSymbol: SimulationAssetSymbol;
  headline: string;
  summary: string;
  eventDate: string;
  category: SimulationEventCategory;
  marketSentiment: SimulationEventMarketSentiment;
  sortOrder?: number;
  sources: SimulationEventSource[];
}

export type SimulationEventScenarioEvent = Omit<SimulationEventSummary, 'sortOrder'>;

export interface SimulationEventListSuccessResponse {
  status: 'success';
  asset: {
    symbol: SimulationAssetSymbol;
    name: string;
    coinGeckoId: string;
  };
  supportedDelays: SimulationEventDelay[];
  events: SimulationEventSummary[];
}

export interface SimulationEventRiskMetrics {
  maxDrawdownPercent: number;
  longestUnderwaterDays: number;
  bestThirtyDayReturnPercent: number;
  worstThirtyDayReturnPercent: number;
  startDate: string;
  endDate: string;
}

export interface SimulationEventScenarioSuccessResponse
  extends Omit<SimulationPriceSuccessResponse, 'input'> {
  event: SimulationEventScenarioEvent;
  input: SimulationPriceSuccessResponse['input'] & {
    delay: SimulationEventDelay;
    intendedBuyDate: string;
  };
  risk: SimulationEventRiskMetrics;
  takeaway: string;
}

export type SimulationEventListResponse =
  | SimulationEventListSuccessResponse
  | SimulationPriceErrorResponse
  | SimulationPriceUnavailableResponse;

export type SimulationEventScenarioResponse =
  | SimulationEventScenarioSuccessResponse
  | SimulationPriceErrorResponse
  | SimulationPriceUnavailableResponse;

export interface SimulationHistoryPoint {
  date: string;
  priceUsd: number;
}

export interface SimulationHistorySuccessResponse {
  status: 'success';
  asset: {
    symbol: SimulationAssetSymbol;
    name: string;
    coinGeckoId: string;
  };
  range: {
    year: number;
    startDate: string;
    endDate: string;
  };
  points: SimulationHistoryPoint[];
  source: ApiResultMetadata;
}

export type SimulationHistoryResponse =
  | SimulationHistorySuccessResponse
  | SimulationPriceErrorResponse
  | SimulationPriceUnavailableResponse;

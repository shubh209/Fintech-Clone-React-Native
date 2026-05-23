import { ApiResultMetadata } from './apiResult';

export type SimulationAssetSymbol = 'BTC' | 'ETH' | 'SOL';
export type SimulationDateResolution = 'exact' | 'next_available';
export type SimulationCurrentCacheStatus = 'fresh' | 'refreshed';

export type SimulationValidationErrorCode =
  | 'missing_asset'
  | 'unsupported_asset'
  | 'missing_date'
  | 'invalid_date'
  | 'date_out_of_range'
  | 'missing_amount'
  | 'invalid_amount';

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

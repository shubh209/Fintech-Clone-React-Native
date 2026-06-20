export type SimulationAssetCatalogStatus =
  | 'ready'
  | 'needs_market_mapping'
  | 'historical_invalid';

export type SimulationAssetMarketStatus = 'fresh' | 'stale' | 'unavailable';
export type SimulationAssetMarketCacheStatus = 'fresh' | 'stale' | 'unavailable';
export type SimulationAssetDataQualityStatus =
  | 'clean'
  | 'repaired'
  | 'quarantined'
  | 'repaired_and_quarantined';

export interface SimulationAssetCatalogItem {
  assetId: string;
  symbol: string;
  name: string;
  category: string;
  status: SimulationAssetCatalogStatus;
  historical: {
    firstDate: string | null;
    lastDate: string | null;
    rowCount: number;
    missingDateCount: number;
    largestGapDays: number;
  };
  dataQuality: {
    repairedRowCount: number;
    quarantinedRowCount: number;
    eligibleRowCount: number;
    quarantineRate: number;
    status: SimulationAssetDataQualityStatus;
  };
  market: {
    coinGeckoId: string | null;
    rank: number | null;
    imageUrl: string | null;
    currentPriceUsd: number | null;
    priceChangePercentage24h: number | null;
    updatedAt: string | null;
    status: SimulationAssetMarketStatus;
  };
  availability: {
    canSimulate: boolean;
    reason: string | null;
    detail: string | null;
  };
}

export interface SimulationAssetCatalogSuccessResponse {
  status: 'success';
  assets: {
    ready: SimulationAssetCatalogItem[];
    unavailable: SimulationAssetCatalogItem[];
  };
  source: {
    historicalProvider: 'historical_csv';
    marketProvider: 'coingecko';
    importedAt: string;
    marketDataUpdatedAt: string | null;
    marketCacheStatus: SimulationAssetMarketCacheStatus;
  };
}

export interface SimulationAssetCatalogErrorResponse {
  status: 'error';
  code: 'simulation_assets_unavailable';
  message: string;
}

export type SimulationAssetCatalogResponse =
  | SimulationAssetCatalogSuccessResponse
  | SimulationAssetCatalogErrorResponse;

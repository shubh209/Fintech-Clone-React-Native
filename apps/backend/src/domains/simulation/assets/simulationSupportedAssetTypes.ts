export interface SimulationSupportedAssetCandidate {
  assetId: string;
  symbol: string;
  name: string;
  status: string;
  coinGeckoId: string | null;
  historicalSymbol: string;
  firstImportedDate: string | null;
  lastImportedDate: string | null;
  importedRowCount: number;
  marketRank: number | null;
}

export interface SimulationSupportedAsset {
  assetId: string;
  symbol: string;
  name: string;
  coinGeckoId: string;
  historicalSymbol: string;
  firstImportedDate: string;
  lastImportedDate: string;
  importedRowCount: number;
  marketRank: number | null;
}

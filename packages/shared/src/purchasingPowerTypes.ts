import { ApiResultMetadata } from './apiResult';

export type PurchasingPowerCityId =
  | 'phoenix'
  | 'san_francisco'
  | 'new_york'
  | 'austin'
  | 'seattle';

export type PurchasingPowerCategory = 'monthly_essentials' | 'big_purchase';

export interface PurchasingPowerCity {
  id: PurchasingPowerCityId;
  name: string;
  state: string;
}

export interface PurchasingPowerItem {
  id: string;
  label: string;
  category: PurchasingPowerCategory;
  costUsd: number;
  sourceLabel: string;
}

export interface PurchasingPowerComparison {
  itemId: string;
  label: string;
  category: PurchasingPowerCategory;
  costUsd: number;
  quantity: number;
  summary: string;
}

export interface PurchasingPowerSuccessResponse {
  status: 'success';
  city: PurchasingPowerCity;
  input: {
    amountUsd: number;
  };
  comparisons: {
    monthlyEssentials: PurchasingPowerComparison[];
    bigPurchases: PurchasingPowerComparison[];
  };
  source: ApiResultMetadata & {
    datasetVersion: string;
  };
}

export interface PurchasingPowerErrorResponse {
  status: 'error';
  code: 'missing_city' | 'unsupported_city' | 'missing_amount' | 'invalid_amount';
  message: string;
}

export type PurchasingPowerResponse =
  | PurchasingPowerSuccessResponse
  | PurchasingPowerErrorResponse;

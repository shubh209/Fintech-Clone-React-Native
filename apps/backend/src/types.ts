export interface JsonStore {
  get<T = unknown>(key: string, type: 'json'): Promise<T | null>;
  put?: (key: string, value: string) => Promise<void>;
}

export interface ApiEnv {
  CRYPTO_API_KEY?: string;
  CRYPTO_FALLBACKS?: JsonStore;
  TRANSACTIONS?: JsonStore;
}

export interface JsonStore {
  get<T = unknown>(key: string, type: 'json'): Promise<T | null>;
}

export interface ApiEnv {
  CRYPTO_API_KEY?: string;
  CRYPTO_FALLBACKS?: JsonStore;
}

export interface JsonStore {
  get<T = unknown>(key: string, type: 'json'): Promise<T | null>;
  put?: (key: string, value: string) => Promise<void>;
}

export interface SqlStatement {
  bind(...values: unknown[]): SqlStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface SqlDatabase {
  prepare(query: string): SqlStatement;
}

export interface ApiEnv {
  CLERK_JWKS_JSON?: string;
  CLERK_JWKS_URL?: string;
  CLERK_JWT_ISSUER?: string;
  COINGECKO_API_KEY?: string;
  CRYPTO_API_KEY?: string;
  CRYPTO_FALLBACKS?: JsonStore;
  HISTORICAL_PRICES_DB?: SqlDatabase;
}

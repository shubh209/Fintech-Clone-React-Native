export interface JsonStore {
  get<T = unknown>(key: string, type: 'json'): Promise<T | null>;
  put?: (key: string, value: string) => Promise<void>;
}

export interface ApiEnv {
  CLERK_JWKS_JSON?: string;
  CLERK_JWKS_URL?: string;
  CLERK_JWT_ISSUER?: string;
  CRYPTO_API_KEY?: string;
  CRYPTO_FALLBACKS?: JsonStore;
  TRANSACTIONS?: JsonStore;
}

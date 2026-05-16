const transactionApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

let transactionAuthTokenProvider: () => Promise<string | null> = async () => null;

export function setTransactionAuthTokenProvider(
  provider: () => Promise<string | null>
) {
  transactionAuthTokenProvider = provider;
}

export function getTransactionAuthToken() {
  return transactionAuthTokenProvider();
}

export function getTransactionApiUrl(path: string, apiBaseUrl = transactionApiBaseUrl) {
  if (!apiBaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL for transaction API requests');
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

const transactionApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

let transactionUserId = 'demo-user';

export function setTransactionUserId(userId: string | null | undefined) {
  transactionUserId = userId?.trim() || 'demo-user';
}

export function getTransactionUserId() {
  return transactionUserId;
}

export function getTransactionApiUrl(path: string, apiBaseUrl = transactionApiBaseUrl) {
  if (!apiBaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL for transaction API requests');
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

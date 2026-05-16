const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export function getCryptoApiUrl(path: string) {
  if (!apiBaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL for cloud API requests');
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

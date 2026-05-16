import { ApiEnv } from '../types';

interface JwtHeader {
  alg?: string;
  kid?: string;
}

interface JwtPayload {
  exp?: number;
  iss?: string;
  nbf?: number;
  sub?: string;
}

type ClerkJsonWebKey = JsonWebKey & { kid?: string };

interface JsonWebKeySet {
  keys?: ClerkJsonWebKey[];
}

function base64UrlToString(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return atob(padded);
}

function base64UrlToBytes(value: string) {
  const binary = base64UrlToString(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function parseJwtPart<T>(value: string): T {
  return JSON.parse(base64UrlToString(value)) as T;
}

function getBearerToken(authorization: string | undefined) {
  const [scheme, token] = authorization?.split(' ') ?? [];
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

async function getJwks(env: ApiEnv): Promise<JsonWebKeySet> {
  if (env.CLERK_JWKS_JSON) {
    return JSON.parse(env.CLERK_JWKS_JSON) as JsonWebKeySet;
  }

  if (!env.CLERK_JWKS_URL) {
    throw new Error('Missing CLERK_JWKS_URL');
  }

  const response = await fetch(env.CLERK_JWKS_URL);

  if (!response.ok) {
    throw new Error(`Unable to load Clerk JWKS: ${response.status}`);
  }

  return response.json();
}

export async function verifyClerkJwt({
  env,
  token,
  nowSeconds = Math.floor(Date.now() / 1000),
}: {
  env: ApiEnv;
  token: string;
  nowSeconds?: number;
}) {
  if (!env.CLERK_JWT_ISSUER) {
    throw new Error('Missing CLERK_JWT_ISSUER');
  }

  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid JWT shape');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = parseJwtPart<JwtHeader>(encodedHeader);
  const payload = parseJwtPart<JwtPayload>(encodedPayload);

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Unsupported JWT algorithm');
  }

  if (payload.iss !== env.CLERK_JWT_ISSUER || !payload.sub) {
    throw new Error('Invalid JWT issuer or subject');
  }

  if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds) {
    throw new Error('Expired JWT');
  }

  if (typeof payload.nbf === 'number' && payload.nbf > nowSeconds) {
    throw new Error('JWT not active');
  }

  const jwks = await getJwks(env);
  const key = jwks.keys?.find((candidate) => candidate.kid === header.kid);

  if (!key) {
    throw new Error('JWT signing key not found');
  }

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    key,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['verify']
  );
  const verified = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    base64UrlToBytes(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );

  if (!verified) {
    throw new Error('Invalid JWT signature');
  }

  return payload.sub;
}

export async function getAuthenticatedTransactionUserId({
  authorization,
  env,
}: {
  authorization: string | undefined;
  env: ApiEnv;
}) {
  const token = getBearerToken(authorization);

  if (!token) return null;

  try {
    return await verifyClerkJwt({ env, token });
  } catch {
    return null;
  }
}

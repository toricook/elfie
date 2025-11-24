type BaseSession = {
  exp: number; // unix epoch seconds
  userId?: number;
  participantId?: number;
  gameId?: number;
  email?: string;
  admin?: boolean;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is missing');
  }
  return secret;
}

function base64Encode(bytes: Uint8Array) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64Decode(base64: string) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toBase64Url(input: ArrayBuffer | string) {
  const bytes = typeof input === 'string' ? textEncoder.encode(input) : new Uint8Array(input);
  return base64Encode(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return base64Decode(padded);
}

async function sign(data: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, textEncoder.encode(data));
  return toBase64Url(sig);
}

async function verify(data: string, signature: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  return crypto.subtle.verify('HMAC', key, fromBase64Url(signature), textEncoder.encode(data));
}

export async function signSession(payload: Omit<BaseSession, 'exp'>, maxAgeSeconds = 60 * 60 * 24 * 30) {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const body = JSON.stringify({ ...payload, exp });
  const bodyB64 = toBase64Url(body);
  const signature = await sign(bodyB64);
  return `${bodyB64}.${signature}`;
}

export async function verifySession(token: string): Promise<BaseSession | null> {
  const [bodyB64, signature] = token.split('.');
  if (!bodyB64 || !signature) return null;

  const isValid = await verify(bodyB64, signature);
  if (!isValid) return null;

  const raw = textDecoder.decode(fromBase64Url(bodyB64));
  const data = JSON.parse(raw) as BaseSession;
  if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return data;
}

export function participantCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 30) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

import { API_BASE_URL } from './config';

type TokenPair = {
  access_token: string;
  refresh_token: string;
  access_exp: string;
  refresh_exp: string;
};

type StoredAuth = {
  email: string;
  password: string;
  tokens: TokenPair | null;
};

const STORAGE_KEY = 'cc_auth';

function getStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

function setStoredAuth(auth: StoredAuth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

function getOrCreateIdentity(): { email: string; password: string } {
  const stored = getStoredAuth();
  if (stored?.email && stored?.password) {
    return { email: stored.email, password: stored.password };
  }
  const random = Math.random().toString(36).slice(2, 10);
  const email = `demo_${random}@example.com`;
  const password = `DemoPass_${random}`;
  setStoredAuth({ email, password, tokens: null });
  return { email, password };
}

export function getTokens(): TokenPair | null {
  return getStoredAuth()?.tokens ?? null;
}

export function setTokens(tokens: TokenPair | null) {
  const current = getStoredAuth();
  if (!current) return;
  setStoredAuth({ ...current, tokens });
}

async function registerOrLogin(email: string, password: string): Promise<TokenPair> {
  const registerRes = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'Demo User' }),
  });

  if (registerRes.ok) {
    return (await registerRes.json()) as TokenPair;
  }

  const loginRes = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    throw new Error('Unable to authenticate demo user');
  }

  return (await loginRes.json()) as TokenPair;
}

export async function ensureAccessToken(): Promise<string> {
  const tokens = getTokens();
  if (tokens?.access_token) return tokens.access_token;

  const identity = getOrCreateIdentity();
  const newTokens = await registerOrLogin(identity.email, identity.password);
  setTokens(newTokens);
  return newTokens.access_token;
}

export async function refreshAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens?.refresh_token) return null;

  const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });

  if (!res.ok) {
    setTokens(null);
    return null;
  }

  const nextTokens = (await res.json()) as TokenPair;
  setTokens(nextTokens);
  return nextTokens.access_token;
}

import { setCsrf } from '../api';
import { stopProductAnalytics } from './productAnalytics';
import type { Org as HostedOrg, PostHogSettings } from './posthogShared';

export type HostedUser = { id: string; name: string; email: string; role: 'member' | 'admin' };
/** The person's personal org, and where product analytics go (null when no PostHog key is configured). */
export type { HostedOrg, PostHogSettings };
/** `shakedown`: hosted Shakedown is on at /sd/ for this account (the gateway's `/gw/api/me`). */
export type HostedSession =
  | { kind: 'local' }
  | { kind: 'signed-out' }
  | { kind: 'signed-in'; user: HostedUser; csrf: string; shakedown?: boolean; org?: HostedOrg | null; posthog?: PostHogSettings | null };

let csrf: string | null = null;

/** Local CopperTide has no `/gw/api/me` (404); the hosted gateway answers 401 or the user. */
export async function loadSession(): Promise<HostedSession> {
  const res = await fetch('/gw/api/me', { credentials: 'same-origin' });
  if (res.status === 404) return { kind: 'local' };
  if (res.status === 401) { csrf = null; setCsrf(null); return { kind: 'signed-out' }; }
  if (!res.ok) throw new GwError(res.status, 'unavailable', 'CopperTide is not answering right now.');
  // Local CopperTide answers this path with the app itself (not JSON): that is local mode.
  const body = await res.json().catch(() => null);
  if (!body?.user || !body.csrf) return { kind: 'local' };
  csrf = body.csrf; setCsrf(body.csrf);
  return { kind: 'signed-in', user: body.user, csrf: body.csrf, shakedown: body.shakedown === true, org: body.org ?? null, posthog: body.posthog ?? null };
}

export class GwError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }

export async function gw<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (method !== 'GET' && csrf) headers['x-csrf-token'] = csrf;
  const res = await fetch(`/gw/api${path}`, { method, headers, credentials: 'same-origin', body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new GwError(res.status, json.error?.code ?? 'http_error', json.error?.message ?? `HTTP ${res.status}`);
  return json as T;
}

/** Signs this browser out, and makes product analytics forget who it was. */
export async function signOut(): Promise<void> {
  stopProductAnalytics();
  await gw('POST', '/logout');
}

export const providerHref = (purpose: { join: string } | 'login', provider: 'google' | 'github') =>
  purpose === 'login' ? `/gw/api/login/oidc/${provider}` : `/gw/api/join/${purpose.join}/oidc/${provider}`;

export const RECORDED = 'To improve the beta we use PostHog to see how CopperTide is used: sign-ins, pages and clicks, and a session replay with every text and input masked. We never send what you type or the content of your teams, prompts or runs.';

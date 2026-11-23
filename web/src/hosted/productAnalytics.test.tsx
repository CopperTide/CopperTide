import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ph = vi.hoisted(() => ({ init: vi.fn(), opt_in_capturing: vi.fn(), identify: vi.fn(), group: vi.fn(), reset: vi.fn(), opt_out_capturing: vi.fn(), stopSessionRecording: vi.fn(), capture: vi.fn() }));
vi.mock('posthog-js', () => ({ default: ph }));
const { routeTemplate, startProductAnalytics, stopProductAnalytics, track } = await import('./productAnalytics');

const user = { id: 'u1', name: 'Ana', email: 'ana@x.com', role: 'member' as const };
const org = { id: 'o1', name: 'Ana' };
const settings = { key: 'phc_test', host: 'https://us.i.posthog.com' };

beforeEach(() => {
  stopProductAnalytics();
  vi.clearAllMocks();
});

it('without a key nothing starts and nothing is captured', async () => {
  await startProductAnalytics(user, org, null);
  track('run downloaded');
  expect(ph.init).not.toHaveBeenCalled();
  expect(ph.capture).not.toHaveBeenCalled();
});

it('track does nothing until signed in with a key (local mode never starts it)', () => {
  track('describe it opened');
  expect(ph.capture).not.toHaveBeenCalled();
});

it('signing in starts PostHog once, identifies the user and groups the org', async () => {
  await Promise.all([startProductAnalytics(user, org, settings), startProductAnalytics(user, org, settings)]);
  expect(ph.init).toHaveBeenCalledTimes(1);
  expect(ph.init.mock.calls[0][0]).toBe('phc_test');
  expect(ph.identify).toHaveBeenCalledWith('u1', { email: 'ana@x.com', name: 'Ana' });
  expect(ph.group).toHaveBeenCalledWith('organization', 'o1', { name: 'Ana' });
  track('team file imported');
  expect(ph.capture).toHaveBeenCalledWith('team file imported', undefined);
});

it('signing out resets PostHog and stops tracking', async () => {
  await startProductAnalytics(user, org, settings);
  stopProductAnalytics();
  expect(ph.reset).toHaveBeenCalledTimes(1);
  track('run imported');
  expect(ph.capture).not.toHaveBeenCalled();
});

it("CopperTide's pages keep only fixed words", () => {
  expect(routeTemplate('/team/secret-plan/structure')).toBe('/team/:id/structure');
  expect(routeTemplate('/rig/my-team/agent/team.a@my-team/conversation')).toBe('/rig/:id/agent/:id/:id');
  expect(routeTemplate('/team/library/structure')).toBe('/team/:id/structure');
  expect(routeTemplate('/community/some-author/some-block')).toBe('/community/:id/:id');
});

describe('the hosted gate', () => {
  const me = (status: number, body: unknown) => vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })));
  const gate = async () => {
    const { HostedGate } = await import('./HostedGate');
    render(<MemoryRouter initialEntries={['/account']}><HostedGate><p>page</p></HostedGate></MemoryRouter>);
  };
  afterEach(() => vi.unstubAllGlobals());

  it('starts PostHog when signed in with a key', async () => {
    me(200, { user, csrf: 'c', org, posthog: settings });
    await gate();
    await waitFor(() => expect(ph.init).toHaveBeenCalledWith('phc_test', expect.objectContaining({ api_host: settings.host })));
    expect(ph.identify).toHaveBeenCalledWith('u1', { email: 'ana@x.com', name: 'Ana' });
  });

  it('does not start PostHog signed in without a key, signed out, or in local mode', async () => {
    for (const [status, body] of [[200, { user, csrf: 'c', org, posthog: null }], [401, {}], [404, {}]] as const) {
      me(status, body);
      await gate();
      await new Promise((r) => setTimeout(r, 20));
      cleanup();
    }
    expect(ph.init).not.toHaveBeenCalled();
  });
});

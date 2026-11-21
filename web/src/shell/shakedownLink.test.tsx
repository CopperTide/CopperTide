import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import { HostedProvider } from '../hosted/HostedGate';
import type { HostedSession } from '../hosted/session';
import { TopBar } from './TopBar';

const user = { id: 'u', name: 'Ana Lee', email: 'a@x', role: 'member' as const };

function bar(s: HostedSession) {
  render(<MemoryRouter><HostedProvider value={s}><TopBar rows={[]} onCommand={() => {}} onHelp={() => {}} /></HostedProvider></MemoryRouter>);
  return screen.getAllByRole('link', { name: 'Shakedown' }).map((a) => a.getAttribute('href'));
}

it('signed in where hosted Shakedown is on, Shakedown opens it at /sd/', () => {
  expect(new Set(bar({ kind: 'signed-in', user, csrf: 'c', shakedown: true }))).toEqual(new Set(['/sd/']));
});

it('elsewhere Shakedown stays the workspace’s own page', () => {
  expect(new Set(bar({ kind: 'signed-in', user, csrf: 'c', shakedown: false }))).toEqual(new Set(['/arena']));
});

it('locally Shakedown stays the workspace’s own page', () => {
  expect(new Set(bar({ kind: 'local' }))).toEqual(new Set(['/arena']));
});

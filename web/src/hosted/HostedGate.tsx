import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loadSession, type HostedSession } from './session';
import { startProductAnalytics } from './productAnalytics';
import { remember, takeRemembered } from './afterLogin';

const Ctx = createContext<HostedSession>({ kind: 'local' });
export const useHosted = () => useContext(Ctx);
/** Supplies a session directly (tests, and pages rendered outside the gate). */
export const HostedProvider = Ctx.Provider;
// Community is readable signed out; signing in is only needed to save, publish or edit a profile.
const OPEN = [/^\/join\//, /^\/reset\//, /^\/login$/, /^\/what-we-record$/, /^\/community(\/|$)/];
/** Where a signed-in person works when the account has hosted Shakedown: its own app. */
export const SHAKEDOWN = '/sd/';
/** The CopperTide pages such a person still reaches: the admin console, ops, invites, resets and the privacy page. */
const KEPT = [/^\/admin(\/|$)/, /^\/ops(\/|$)/, /^\/join\//, /^\/reset\//, /^\/what-we-record$/];
const kept = (path: string) => KEPT.some((r) => r.test(path.split('?')[0]));
/** Full-page navigation out of this app (Shakedown is another app); tests replace `to`. */
export const leave = { to: (href: string) => window.location.replace(href) };

/** Where a signed-in visit to `path` goes: the remembered page on `/`, else Shakedown unless the page is kept. */
function shakedownHome(path: string, navigate: (to: string, o: { replace: boolean }) => void) {
  const back = path === '/' ? takeRemembered() : null;
  if (back && kept(back)) return navigate(back, { replace: true });
  if (back?.startsWith(SHAKEDOWN)) return leave.to(back);
  if (!kept(path)) leave.to(SHAKEDOWN);
}

/**
 * Signed in: with hosted Shakedown, every page but the kept ones goes there; else, on the home page, back
 * to the page that sent this visitor to sign in, if any. True while the account has Shakedown.
 */
function useSignedInHome(s: HostedSession | null, path: string): boolean {
  const navigate = useNavigate();
  const signedIn = s?.kind === 'signed-in';
  const shakedown = s?.kind === 'signed-in' && s.shakedown === true;
  useEffect(() => {
    if (!signedIn) return;
    if (shakedown) return shakedownHome(path, navigate);
    if (path !== '/') return;
    const back = takeRemembered();
    if (back) navigate(back, { replace: true });
  }, [signedIn, shakedown, path, navigate]);
  return shakedown;
}

export function HostedGate({ children }: { children: ReactNode }) {
  const [s, setS] = useState<HostedSession | null>(null);
  const [down, setDown] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const loc = useLocation();
  useEffect(() => { loadSession().then((x) => { setDown(false); setS(x); }, () => setDown(true)); }, [attempt]);
  // Product analytics, while signed in with a key configured (local mode has neither). See /what-we-record.
  useEffect(() => { if (s?.kind === 'signed-in') startProductAnalytics(s.user, s.org ?? null, s.posthog ?? null); }, [s]);
  const shakedown = useSignedInHome(s, loc.pathname);
  if (down) return (
    <main className="hosted-page" role="alert">
      <h1>CopperTide is not answering</h1>
      <p>This is usually brief. Your work is safe.</p>
      <button className="btn btn-primary" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
    </main>
  );
  if (!s) return null;
  if (shakedown && !kept(loc.pathname)) return null; // on the way to Shakedown
  if (s.kind === 'signed-out' && !OPEN.some((r) => r.test(loc.pathname))) {
    remember(loc.pathname + loc.search);
    return <Navigate replace to="/login" />;
  }

  return <Ctx.Provider value={s}>{children}</Ctx.Provider>;
}

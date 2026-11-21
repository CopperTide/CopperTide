import type { ReactNode } from 'react';
import { ApiError } from '../api';
import { SHAKEDOWN_DOWN, SHAKEDOWN_START_COMMAND } from '../errors';
import { ErrorNote } from '../tests/shared';
import { isShakedownDown, useShakedown } from './data';

/** The page-level alarm while Shakedown is not answering: say so plainly, with how to start it. What controld saw is evidence. */
export function ShakedownDownBanner({ error }: { error: unknown }) {
  const raw = error instanceof ApiError ? error.raw : undefined;
  return (
    <div className="shakedown-alarm" role="alert">
      <span className="shakedown-alarm-head"><span aria-hidden="true">■</span> {SHAKEDOWN_DOWN}</span>
      <span>Start it in the shakedown folder with <code className="mono">{SHAKEDOWN_START_COMMAND}</code>. This page checks again every 15 seconds.</span>
      {raw && <span className="tst-evidence mono tst-small" data-raw-evidence>Shakedown said: {raw}</span>}
    </div>
  );
}

/** A pane's place-holder while Shakedown is not answering; the banner above says why and how to start it. */
export function Offline() {
  return <p className="shakedown-offline" role="status"><span aria-hidden="true">■</span> Offline: {SHAKEDOWN_DOWN}.</p>;
}

/** Any Shakedown error: "Offline" when Shakedown is not answering, otherwise its plain sentence. */
export function ShakedownProblem({ error, text }: { error: unknown; text?: string }) {
  if (error == null) return null;
  return isShakedownDown(error) ? <Offline /> : <ErrorNote error={error} text={text} />;
}

/** A pane's body once Shakedown answers; before that, "asking", or why it isn't answering. */
export function ShakedownGate({ children }: { children: ReactNode }) {
  const { health, healthError } = useShakedown();
  if (health === undefined) return <p className="muted shakedown-pad">Asking Shakedown…</p>;
  if (health === null) return <div className="shakedown-pad"><ShakedownProblem error={healthError} /></div>;
  return <>{children}</>;
}

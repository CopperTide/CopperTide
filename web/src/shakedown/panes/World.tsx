import { plural } from '../../format';
import type { WorldPartInfo } from '../../tests/types';
import { useShakedown } from '../data';
import { ShakedownGate, ShakedownProblem } from '../gate';
import { CANT_RESTORE, restoreWords } from '../words';

function Answered({ part }: { part: WorldPartInfo }) {
  return part.answered
    ? <span className="tst-status tst-done"><span aria-hidden="true">✓</span>Answered</span>
    : <span className="tst-status tst-blocked"><span aria-hidden="true">⚠</span>Not answering</span>;
}

/** Whether the part runs on the shakedown's clock: glyph and word. */
function Clock({ uses }: { uses?: boolean }) {
  if (uses == null) return <span className="muted"><span aria-hidden="true">?</span> Clock unknown</span>;
  return uses ? <span><span aria-hidden="true">◷</span> Shakedown clock</span> : <span className="muted"><span aria-hidden="true">○</span> Own time</span>;
}

function Restore({ part }: { part: WorldPartInfo }) {
  if (!part.answered) return <span className="muted">Restore unknown</span>;
  return (
    <span className="shakedown-chips">
      {restoreWords(part.restore).map((w) => (w === CANT_RESTORE
        ? <span key={w} className="shakedown-chip shakedown-chip-none"><span aria-hidden="true">⊘</span> {w}</span>
        : <span key={w} className="shakedown-chip">{w}</span>))}
    </span>
  );
}

function Tools({ tools }: { tools?: string[] }) {
  if (!tools) return <span className="muted">Tools unknown</span>;
  if (!tools.length) return <span className="muted">No tools of its own</span>;
  return (
    <details className="shakedown-tools">
      <summary className="shakedown-num">{plural(tools.length, 'tool')}</summary>
      <ul>{tools.map((t) => <li key={t} className="mono">{t}</li>)}</ul>
    </details>
  );
}

/** One row per part; a part that did not answer gets a second row with what it said, as evidence. */
function PartRows({ part }: { part: WorldPartInfo }) {
  return (
    <>
      <tr aria-label={`Part ${part.name}`}>
        <td><strong>{part.name}</strong></td>
        <td className="mono muted">{part.integration}{part.version ? `@${part.version}` : ''}</td>
        <td><Restore part={part} /></td>
        <td><Clock uses={part.uses_clock} /></td>
        <td className="shakedown-num"><Tools tools={part.tools} /></td>
        <td><Answered part={part} /></td>
      </tr>
      {!part.answered && (
        <tr className="shakedown-subrow">
          <td colSpan={6}>Its integration did not describe itself, so how it restores is unknown. It said:{' '}
            <span className="tst-evidence mono" data-raw-evidence>{part.error ?? 'nothing'}</span>
          </td>
        </tr>
      )}
    </>
  );
}

function WorldBody() {
  const { world } = useShakedown();
  const parts = world.value?.parts;
  return (
    <>
      <ShakedownProblem error={world.error} />
      {!parts && !world.error && <p className="muted">Asking each part…</p>}
      {parts?.length === 0 && <p className="muted">This benchmark's world has no parts.</p>}
      {!!parts?.length && (
        <div className="shakedown-table-wrap">
          <table className="shakedown-table" aria-label="World parts">
            <thead><tr><th>Part</th><th>Integration</th><th>Restore</th><th>Clock</th><th className="shakedown-num">Tools</th><th>Status</th></tr></thead>
            <tbody>{parts.map((p) => <PartRows key={p.name} part={p} />)}</tbody>
          </table>
        </div>
      )}
    </>
  );
}

/** The benchmark's parts: integration and version, how each restores, its clock and its tools. */
export function WorldPane() {
  return <div className="shakedown-pane"><ShakedownGate><WorldBody /></ShakedownGate></div>;
}

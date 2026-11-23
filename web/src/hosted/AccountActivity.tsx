import { useEffect, useState } from 'react';
import { gw } from './session';

type Entry = { id: number; at: string; action: string; detail: Record<string, unknown>; email: string | null };

const METHOD: Record<string, string> = { password: 'a password', google: 'Google', github: 'GitHub' };
const how = (d: Entry['detail']) => METHOD[String(d.method)] ?? 'an unknown method';

/** The account audit trail's actions in plain words. Unknown actions show their code word. */
function words(e: Entry): string {
  const d = e.detail;
  switch (e.action) {
    case 'signin.succeeded': return `signed in with ${how(d)}`;
    case 'signin.failed': return `failed to sign in with ${how(d)} (${String(d.reason)})`;
    case 'user.signed_up': return `signed up with ${how(d)}${d.invited ? ' from an invite' : ''}`;
    case 'invite.created': return `created ${d.kind === 'reset' ? 'a reset link' : d.kind === 'group' ? 'a group link' : 'an invite'}`;
    case 'invite.accepted': return 'joined with an invite';
    case 'invite.revoked': return 'revoked an invite';
    case 'session.revoked': return `${d.all ? 'every session' : 'a session'} ended (by ${String(d.by).replace('_', ' ')})`;
    case 'api.write': return `${String(d.method)} ${String(d.route)} → ${String(d.status)}`;
    default: return e.action;
  }
}

/** Account security events (sign-ins, failed sign-ins, invites, sessions; API writes on request), newest first. */
export function AccountActivity() {
  const [list, setList] = useState<Entry[]>([]);
  const [api, setApi] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { gw<Entry[]>('GET', `/admin/audit/account${api ? '?api=true' : ''}`).then(setList, (e) => setError((e as Error).message)); }, [api]);
  return (
    <section aria-label="Account activity">
      <h2>Account activity</h2>
      <p className="muted">Sign-ins, failed sign-ins, sign-ups, invites and ended sessions, newest first (the latest 500, kept 13 months).</p>
      <label><input type="checkbox" checked={api} onChange={(e) => setApi(e.target.checked)} /> Include API writes</label>
      {error && <p className="tone-red" role="alert">{error}</p>}
      <table aria-label="Account events"><thead><tr><th>When</th><th>Account</th><th>What</th></tr></thead><tbody>
        {list.map((e) => <tr key={e.id}><td>{new Date(e.at).toLocaleString()}</td><td>{e.email ?? 'no account'}</td><td>{words(e)}</td></tr>)}
      </tbody></table>
    </section>
  );
}

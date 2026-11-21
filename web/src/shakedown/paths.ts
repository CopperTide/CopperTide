// Every Shakedown address, in one place. A branch's page is its simulated Control workspace.
const e = encodeURIComponent;

export const SHAKEDOWN_PATH = '/shakedown';
export const runPath = (run: string, branch: string, step?: number) =>
  `${SHAKEDOWN_PATH}/runs/${e(run)}/${e(branch)}${step != null ? `?step=${step}` : ''}`;
/** Where a popped-out pane of a branch's simulated Control workspace opens. */
export const runPanePath = (run: string, branch: string, instance: string) => `${SHAKEDOWN_PATH}/runs/${e(run)}/${e(branch)}/pane/${e(instance)}`;
export const comparePath = (a: string, b: string) => `${SHAKEDOWN_PATH}/compare/${e(a)}/${e(b)}`;
/** Where a popped-out Shakedown control pane opens. */
export const shakedownPanePath = (instance: string) => `${SHAKEDOWN_PATH}/pane/${e(instance)}`;

/** The Shakedown address an old `/tests…` one now lives at. The test team is edited in the Runs pane. */
export function legacyTestsPath(pathname: string, search = ''): string {
  const rest = pathname.replace(/^\/tests\/?/, '');
  if (rest === '' || rest === 'team' || rest.startsWith('team/')) return SHAKEDOWN_PATH;
  return `${SHAKEDOWN_PATH}/${rest}${search}`;
}

import { splitOf as split, stackOf, type PageLayouts } from '../workspace/model';

/** A stack holding one pane; the pane's id is `id`, its stack's `id-s`. */
const stack = (id: string, type: string) => stackOf([id, type]);

/** Shakedown control's first-open layouts: Overview (Runs beside World over Engine) and Storage (Saves and disk beside Fork tree). */
export function shakedownDefaults(): PageLayouts {
  return {
    version: 1,
    active: 'overview',
    layouts: [
      {
        id: 'overview', name: 'Overview', popped: [],
        root: split('ov', 'row', [stack('ov-runs', 'shakedown.runs'), split('ov-side', 'col', [stack('ov-world', 'shakedown.world'), stack('ov-engine', 'shakedown.engine')], [0.7, 0.3])], [0.45, 0.55]),
      },
      {
        id: 'storage', name: 'Storage', popped: [],
        root: split('st', 'row', [stack('st-storage', 'shakedown.storage'), stack('st-forks', 'shakedown.forks')], [0.5, 0.5]),
      },
    ],
  };
}

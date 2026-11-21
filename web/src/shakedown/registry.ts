import { createRegistry } from '../workspace/registry';
import { ComparePane } from './panes/Compare';
import { EnginePane } from './panes/Engine';
import { ForkTreePane } from './panes/ForkTree';
import { RunsPane } from './panes/Runs';
import { StoragePane } from './panes/Storage';
import { WorldPane } from './panes/World';

/** Shakedown control's pane types. Made once, here: the workspace keeps the wrapped types by identity. */
export const shakedownRegistry = createRegistry([
  { type: 'shakedown.runs', title: 'Runs', glyph: '▶', Body: RunsPane },
  { type: 'shakedown.forks', title: 'Fork tree', glyph: '⑂', Body: ForkTreePane },
  { type: 'shakedown.world', title: 'World', glyph: '◎', Body: WorldPane },
  { type: 'shakedown.storage', title: 'Saves and disk', glyph: '▤', Body: StoragePane },
  { type: 'shakedown.engine', title: 'Engine', glyph: '⚙', Body: EnginePane },
  { type: 'shakedown.compare', title: 'Compare', glyph: '⇄', multi: true, defaultSettings: {}, Body: ComparePane },
]);

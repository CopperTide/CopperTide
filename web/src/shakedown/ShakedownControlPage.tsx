import { useParams } from 'react-router-dom';
import { Icon } from '../shell/ui';
import { PopOutPane } from '../workspace/PopOutPane';
import { WorkspacePage } from '../workspace/WorkspacePage';
import { isShakedownDown, useShakedownData, type ShakedownCtx } from './data';
import { shakedownDefaults } from './defaults';
import { ShakedownDownBanner } from './gate';
import { shakedownPanePath } from './paths';
import { shakedownRegistry } from './registry';
import { StatusStrip } from './StatusStrip';
import '../tests/tests.css';
import './shakedown.css';

/** The workspace's name for its layouts and its selection channel. */
export const SHAKEDOWN_PAGE = 'shakedown';

/** While Shakedown is not answering, one alarm for the whole page; the panes only say "Offline". */
function DownBanner({ ctx }: { ctx: ShakedownCtx }) {
  return ctx.health === null && isShakedownDown(ctx.healthError) ? <ShakedownDownBanner error={ctx.healthError} /> : null;
}

function Header({ ctx }: { ctx: ShakedownCtx }) {
  return (
    <>
      <div className="shakedown-head">
        <h1 className="shakedown-title"><Icon name="flask" size={16} /> Shakedown control</h1>
        <StatusStrip ctx={ctx} />
      </div>
      <DownBanner ctx={ctx} />
    </>
  );
}

/** `/shakedown`: Shakedown's runs, forks, world, saves and health, as panes the operator can arrange. */
export function ShakedownControlPage() {
  const ctx = useShakedownData();
  return (
    <main className="shakedown-page">
      <WorkspacePage page={SHAKEDOWN_PAGE} registry={shakedownRegistry} ctx={ctx} defaults={shakedownDefaults} paneRoute={shakedownPanePath} header={<Header ctx={ctx} />} />
    </main>
  );
}

/** `/shakedown/pane/:instance`: one popped-out pane in its own window, without the app's bars. */
export function ShakedownPanePage() {
  const { instance = '' } = useParams();
  const ctx = useShakedownData();
  return (
    <main className="shakedown-page shakedown-popout">
      <DownBanner ctx={ctx} />
      <PopOutPane page={SHAKEDOWN_PAGE} registry={shakedownRegistry} ctx={ctx} instance={instance} />
    </main>
  );
}

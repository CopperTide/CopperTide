import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { TooltipLayer } from './shell/ui';
// The brand typefaces, self-hosted (no request leaves the app): Instrument Sans for the UI, IBM Plex Mono for code.
import '@fontsource/instrument-sans/latin-400.css';
import '@fontsource/instrument-sans/latin-500.css';
import '@fontsource/instrument-sans/latin-600.css';
import '@fontsource/instrument-sans/latin-700.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import './tokens.css';
import './styles.css';
import './polish.css';
import './usability.css';
import './release/release.css';
import './coastal.css';
import './simple.css';
import './ux.css';
import './power.css';
import './distill.css';
import './standard.css';
import './pages.css';
import './workspace/workspace.css';
import './shell/logos.css';
import { applyAppearance, readAppearance } from './appearance';

// Retain browser preferences when upgrading an existing installation.
for (const storage of [localStorage,sessionStorage]) {
  try {
    for (const key of Object.keys(storage)) {
      const renamed=key.replace(/^rig-control(?=[.:/-]|$)/,'sculptured').replace(/^rig-workspace-/,'sculptured-workspace-');
      if(renamed!==key&&storage.getItem(renamed)===null)storage.setItem(renamed,storage.getItem(key)!);
    }
  } catch { /* Storage can be unavailable; use session defaults. */ }
}
applyAppearance(readAppearance());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <TooltipLayer />
  </StrictMode>,
);

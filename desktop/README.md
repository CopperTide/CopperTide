# CopperTide desktop

An Electron window for CopperTide. On first launch it asks how you want to use CopperTide and remembers the answer. Change it later from the app menu with **Switch mode…**.

| Mode | What happens |
|---|---|
| **On this computer** | The local workspace. The app uses a CopperTide already answering on `127.0.0.1:4410`, or starts the bundled `coppertide serve` with your usual data folder (`~/.coppertide`). Closing the app stops the `serve` it started. The runner keeps running agents, as it does whenever `serve` stops. |
| **CopperTide account** | Your account's site. The bundled `coppertide connect` pairs this computer (you approve the code in the same window) and runs your agents while the app is open. Quitting asks first, then stops the runner and its agents. |

Teams and settings are not synced between the two modes yet.

Google and GitHub sign-in pages stay in the window. Other web links, such as a CLI's sign-in page, open in the system browser.

## What it needs

- A release build of the `coppertide` binary, bundled as `resources/bin`.
- The built web app, bundled as `resources/web`.
- Node.js 24 to build the app.

| Variable | Effect |
|---|---|
| `COPPERTIDE_PORT` | The local port (default `4410`) |
| `COPPERTIDE_DATA_DIR` | The data folder, to try a build without touching your teams |
| `COPPERTIDE_BIN` | The `coppertide` binary to run instead of the bundled one |
| `COPPERTIDE_ACCOUNT_ORIGIN` | Pre-fills the account address in the mode chooser |
| `COPPERTIDE_DEV=1` | Also accepts `http://127.0.0.1` and `http://localhost` account addresses, for staging |

Older `SCULPTURED_*` names of these variables still work.

## Build and run

From the repository root:

```bash
cargo build --release -p coppertide                 # the binary bundled as resources/bin
npm --prefix web ci && npm --prefix web run build   # the web app bundled as resources/web
cd desktop && npm ci
npm start        # run from source
npm run pack     # unpacked app in dist/<platform>-unpacked, for a quick check
npm run dist     # installers: Linux .deb and AppImage, macOS .dmg, Windows .exe (NSIS)
```

Build each platform's installer on that platform, because the bundled binary is native. CI builds the macOS app from `main` (`.github/workflows/mac.yml`).

## Tests

```bash
cd desktop && npm test       # unit tests with node:test (test/*.test.mjs)
```

## Limits

- **Linux sandbox.** Prefer the `.deb` on Ubuntu: it installs Chromium's `chrome-sandbox` helper owned by root with mode 4755. An unpacked build or AppImage on Ubuntu 24.04 or newer stops with "The SUID sandbox helper binary was found, but is not configured correctly". Fix the helper (`sudo chown root:root chrome-sandbox && sudo chmod 4755 chrome-sandbox`) or allow unprivileged user namespaces. Do not ship `--no-sandbox`.
- **macOS signing.** The CI build is signed ad hoc, not with an Apple Developer ID, so macOS asks once before it first opens.
- The app identifier is still `dev.sculptured.desktop` (historical name).

See [Desktop and installers](../docs/internals/desktop-and-installers.md) for how the modes and release files work, and the [top-level README](../README.md) for the rest of CopperTide.

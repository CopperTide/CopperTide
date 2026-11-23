# Docs screenshots

`capture.mjs` takes the screenshots in `../images/{quickstart,guides,import}` and the board picture in the top-level README (`../../docs/images/board.png`) from the real, running CopperTide app. Nothing is drawn or mocked. Re-run it after a UI change that these images show.

These images belong to the team-of-agents pages, which are out of the docs navigation for now, and to the README. The Shakedown pages of the guide have no screenshots yet.

## What it needs

- A debug build of `coppertide` and the built web app.
- Google Chrome at `/usr/bin/google-chrome`, or another Chrome passed with `--chrome <path>`.
- `npm ci` run in `docs-site/` (for `puppeteer-core`).
- A fixture CLI that answers "Improve this team with AI" with one canned team, so no model is called.

## Run it

1. Build the app and its web UI from the repository root:

   ```bash
   cargo build -p coppertide && npm --prefix web run build
   ```

2. Make an empty data folder and a home folder with an `app` folder in it, for example `/tmp/docsd` and `/tmp/docshome/app`. Keep the data folder's path short: the agents' tool socket lives in it, and socket paths are limited to about 100 characters.

3. Make the fixture CLI outside the repository:

   ```sh
   #!/bin/sh
   [ "$1" = --version ] && echo "fixture 1.0" && exit 0
   cat > /dev/null
   cat /path/to/teams.json   # {"type":"result","structured_output":{"alternatives":[{"label":"team","rationale":"…","team":{…}}]}}
   ```

4. Serve on a spare port from the repository root (it serves `web/dist`):

   ```bash
   HOME=/tmp/docshome target/debug/coppertide serve --port 4499 --data-dir /tmp/docsd \
     --claude-program /path/to/fixture-cli --codex-program /bin/false
   ```

5. Capture, from `docs-site/`:

   ```bash
   npm run screenshots -- --base http://127.0.0.1:4499 --session-folder /tmp/docshome/app
   ```

   Add `--only <step>` to retake one group, or `--from <step>` to continue from one. The steps are `startFrom`, `websiteLaunch`, `manyChildren`, `importSession` and `readmeBoard`. Each run creates its teams again, so start from an empty data folder for a clean Projects list. Stop the server when done.

6. Look at every image before you commit: the state it shows, nothing clipped, and nothing personal (only `~/app` paths and made-up teams).

## How it's checked

There is no automated test. The review in step 6 is the check.

## Limits

- `--base` is required, so the script never drives a CopperTide you use for real work.
- The teams are Practice agents, so no model is called. Their replies read "stub received: …".
- Screens are 1280×800. The README board is 1440×860 at twice the pixels, so it stays sharp on GitHub.
- The images use the app's defaults: the CopperTide look and the Cards board style.

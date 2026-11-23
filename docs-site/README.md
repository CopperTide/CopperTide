# Shakedown user guide (docs.coppertide.ai)

The sources of the Shakedown user guide, published at [docs.coppertide.ai](https://docs.coppertide.ai). Pages are MDX, and `docs.json` holds the navigation. The same sources work in a Mintlify preview and in the static site that `build.mjs` produces.

The guide documents Shakedown, hosted and open source. The engine's developer docs live in the [Shakedown repository](https://github.com/CopperTide/Shakedown): link to them rather than copy them. For how the CopperTide app is built, see the [internals](../docs/internals/README.md).

## What's here

| Navigation group | Pages |
|---|---|
| Get started | `introduction`, `quickstart`, `concepts` |
| Build worlds | `worlds/` |
| Agents | `agents/` |
| Run and read results | `runs/` |
| Use from code | `code/`: the Python SDK, the MCP server, the HTTP API |
| Self-host | `self-host` |
| Account | `account/`: sign-in, keys, quotas |
| Help | `faq`, `updates` |

The team-of-agents pages (`guides/`, `reference/`, `connect-a-computer`, `operations`, `security`, `privacy`, `troubleshooting`, `changelog`) are out of the navigation and not built. Their files stay in the repository.

## What it needs

- Node.js 24.
- No Mintlify login for navigation and content in the preview. Search in the preview needs one.

## Preview and build

From this folder:

```bash
npm ci
npm run dev      # Mintlify preview on port 4411
npm run build    # static site in dist/
```

The preview may listen on your network as well as on localhost. It serves only documentation.

`npm run build` writes HTML, images, a Markdown copy of each page, `llms.txt` and `llms-full.txt` to `dist/`. It also publishes the JSON Schemas from `../web/public/schema/` at `/schema/`. Do not edit `dist/` by hand.

## Tests

Run all three after editing MDX or navigation:

```bash
npm test             # builds every navigation page in a temporary folder and checks the output
npm run validate     # Mintlify: checks the site configuration
npm run links        # Mintlify: checks internal links
```

`npm test` checks rendered components, navigation, Markdown exports, schemas, images and internal links. The build fails on a link to a missing page or file, or to an anchor, because headings get no anchors.

## Writing pages

- Check every claim against the Shakedown code. Say plainly what is not there yet.
- Keep the quickstart on a first successful run. Put procedures in guides, and exact fields, defaults and limits in reference pages. Link instead of repeating.
- Give each page a descriptive title and a one-line summary. Lead a procedure with its prerequisites, then give the steps in order. Use the app's exact labels.
- Keep agent reports, captured events, estimates and verified checks distinct.
- Keep page paths stable. Add new pages to `docs.json` and update links when a page moves.
- Use recordings or screenshots of the real application only. See the [screenshot workflow](screenshots/README.md).
- Follow the house style: plain words, short sentences, no hype.

## Limits

- Publishing the guide deploys only documentation. docs.coppertide.ai is rebuilt from this folder on `main`.
- The screenshot script captures images for the team-of-agents pages and the top-level README, not for the Shakedown pages, which have no screenshots yet.

# CopperTide artwork

Copies of the finished CopperTide brand artwork, served by the app at `/brand/`. Do not redraw them.

| File | Use |
|---|---|
| `coppertide-mark-256.png` | The mark, for images and other sites (the hosted service links to it) |
| `coppertide-mark-64.png` | A small copy of the mark |
| `coppertide-favicon.svg` | The browser icon (`web/index.html`) |
| `coppertide-lockup.svg`, `coppertide-lockup-dark.svg` | The mark with the wordmark, for light and dark pages |
| `sculptured-coastal-emblem*.png` | The previous artwork (historical name). Nothing in the app uses these files. They stay for anything that still fetches the old path, and go in a later cleanup. |

The app does not load these files for its own header. `web/src/shell/BrandMark.tsx` draws the mark and lockup inline, coloured by the tokens `--brand-ink` and `--brand-copper` in `web/src/tokens.css`, so they follow each look and mode.

A test in `crates/coppertide/src/web_cache.rs` checks that `coppertide-mark-256.png` and `coppertide-favicon.svg` ship. Keep those names.

See the [top-level README](../../../README.md) for the rest of CopperTide.

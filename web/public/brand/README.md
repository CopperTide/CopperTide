# CopperTide artwork

The CopperTide brand files are copies of the finished artwork (the mark, the favicon and the
lockups in light and dark). Do not redraw them.

- `coppertide-mark-256.png` is the mark for images and other sites; `coppertide-mark-64.png` is its small copy.
- `coppertide-favicon.svg` is the browser icon.
- `coppertide-lockup.svg` and `coppertide-lockup-dark.svg` are the mark with the wordmark, for light and dark pages.

The app draws the mark and lockup inline (`web/src/shell/BrandMark.tsx`) from the tokens
`--brand-ink` and `--brand-copper` in `web/src/coastal.css`, so they follow each look and mode.

`sculptured-coastal-emblem*.png` are the previous artwork. The app no longer uses them; they stay
so a gateway that still fetches the old path keeps working, and are removed in a later phase.
Their palette notes still live in `web/src/coastal.css`.

Approved landing design (exported from the design tool, with the real Willo images swapped in).
Regenerate the page with scripts/port-reference-landing.py; edit copy here, not in the generated TSX.

## Scroll scenes (added after generating)

`reference-landing.tsx` wraps three sections in `<ScrollScene>` (pinned while
scrolling plays them): the hero (`name="hero"`), the platform tour (`"tour"`)
and "How it works" (`"steps"`), and imports `ScrollScene` from
`./scroll-scene`. The page wrapper uses `overflow-x: clip` (not `hidden`) so
pinning works. Re-add these after regenerating the file. The animation itself
lives in `src/components/lp/landing-scroll-fx.tsx`.

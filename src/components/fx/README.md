# fx

Animated controls from React Bits (https://reactbits.dev), copied here and changed in three ways:
`motion` is imported as `m` (the app uses a strict `LazyMotion`), icons come from lucide (`icons.jsx`)
instead of Hugeicons, and each has a `.d.ts` for TypeScript. Vendored code: excluded from lint.
Colours are passed as CSS variables from the app's tokens, so they follow the theme.

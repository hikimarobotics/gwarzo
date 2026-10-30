# Gwarzo

A time-bending 3D puzzle adventure set in ancient Hausaland, for web and mobile. React Three Fiber + three.js,
TypeScript, Vite. See README.md for the code map.

- Characters and scenery are built in code from three.js primitives with toon materials (`src/world/toon.ts`); keep
  it that way unless a task says otherwise. Animation is procedural, driven by game state.
- Game logic (`src/game/`) is plain TypeScript over plain data, independent of React and three.js, with Vitest tests
  beside it. The world (`src/world/`) only renders that state.
- Before opening a PR: `npm run typecheck`, `npm test` and `npm run build` must pass. For visible changes, check the
  game in a real browser and add screenshots to the PR.
- Cultural content (clothing, architecture, legends) should be respectful and specific to the Hausa kingdoms of the
  era; avoid caricature.

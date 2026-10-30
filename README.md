# Gwarzo

A time-bending 3D puzzle adventure through the legends of ancient Hausaland, for the web and phones.

You play a griot's apprentice in old Northern Nigeria who learns to rewind, hold and hasten time with a talking
drum (kalangu), and uses it to settle battles, defeat monsters, talk warlords down and stop disasters. Each chapter
is built on a real legend or historical event.

**Chapter 1: The Well at Daura**, after the legend of Bayajidda and the snake in the well.

![Jumping across the rooftops of Daura](docs/screenshots/jump.png)

## Where it is now

Week 1 of the first playable: walk, run, jump and climb your way along a street in Daura to the well.

- The hero and the whole town are built in code from simple shapes with toon shading. There are no model or
  animation files: the walk, run, jump, climb and idle animations are computed every frame from the hero's movement.
- Movement runs on a fixed 60 Hz step over plain data (`src/game/physics.ts`), so it can be tested, and later
  recorded and rewound by the time system.
- Keyboard on desktop, on-screen buttons on phones.

Next: the time system (rewind, hold and hasten on single objects), then puzzles, then the snake.

## Run it

Needs Node.js 22 or newer.

```bash
npm install
npm run dev
```

Then open the address Vite prints. `?start=40` drops the hero further along the street, for testing.

| Command | What it does |
| --- | --- |
| `npm run dev` | the game with live reload |
| `npm test` | the unit tests (Vitest) |
| `npm run typecheck` | TypeScript, no output |
| `npm run build` | typecheck, then a production build in `dist/` |

## Controls

| Desktop | Phone | Action |
| --- | --- | --- |
| ← → or A D | ◀ ▶ | walk |
| Shift | Run | run |
| Space | Jump | jump (hold for higher) |
| ↑ / ↓ or W / S | ▲ ▼ | climb a rope or ladder |

## Code map

| Path | What's there |
| --- | --- |
| `src/game/level.ts` | the chapter's layout: everything solid, ropes and ladders, the goal |
| `src/game/physics.ts` | hero movement, pure functions, with tests beside it |
| `src/game/input.ts` | keyboard and touch folded into one input |
| `src/world/Hero.tsx` | the code-built hero and its procedural animation |
| `src/world/Daura.tsx` | the town, built from the level data plus a background skyline |
| `src/world/Game.tsx` | the game loop, lights and side-on follow camera |
| `src/world/toon.ts` | shared toon materials and the chapter's palette |
| `src/ui/` | on-screen touch controls |

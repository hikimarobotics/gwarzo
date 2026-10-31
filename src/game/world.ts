import type { Level } from './level';
import { spawnHero, step, type Hero, type Input } from './physics';
import { newClocks, newDrum, playDrum, shapeOf, solidBoxes, tickClocks, type Clock, type Drum, type DrumInput } from './time';

// One tick of the whole chapter: the drum picks its target, time objects move on their clocks, whatever the hero
// stands on carries them along, then the hero moves. Plain data in, plain data out.

export interface World {
  hero: Hero;
  drum: Drum;
  clocks: Record<string, Clock>;
}

export type WorldInput = Input & DrumInput;

export function newWorld(level: Level, hero: Hero = spawnHero(level)): World {
  return { hero, drum: newDrum(), clocks: newClocks(level.things) };
}

export function stepWorld(world: World, input: WorldInput, level: Level, dt: number): World {
  const drum = playDrum(world.drum, input, level.things, world.clocks, world.hero);
  const clocks = tickClocks(world.clocks, level.things, drum, world.hero.x, dt);

  // Ride along: move the hero by however far the thing under them moved.
  let hero = world.hero;
  const under = hero.standingOn ? level.things.find((t) => t.id === hero.standingOn) : undefined;
  if (under) {
    const before = shapeOf(under, world.clocks[under.id].t);
    const after = shapeOf(under, clocks[under.id].t);
    if (after.solid) {
      hero = { ...hero, x: hero.x + after.box.x - before.box.x, y: after.box.y + after.box.h };
    }
  }

  hero = step(hero, input, level, dt, solidBoxes(level.things, clocks));
  return { hero, drum, clocks };
}

import { describe, expect, it } from 'vitest';
import { DAURA } from './level';
import { atGoal } from './physics';
import { shapeOf } from './time';
import { newWorld, stepWorld, type World, type WorldInput } from './world';

const DT = 1 / 60;
const none: WorldInput = { move: 0, up: false, down: false, jump: false, run: false, rewind: false, hold: false, hasten: false };

const top = (w: World, id: string) => {
  const thing = DAURA.things.find((t) => t.id === id)!;
  const b = shapeOf(thing, w.clocks[id].t).box;
  return b.y + b.h;
};

describe('the Daura chapter, played through', () => {
  it('the bridge collapses as the hero nears it, and a rewind and a hold carry them across', () => {
    let w = newWorld(DAURA);
    const tick = (i: Partial<WorldInput>, n = 1) => {
      for (let k = 0; k < n; k++) w = stepWorld(w, { ...none, ...i }, DAURA, DT);
    };
    tick({}, 30);
    w = { ...w, hero: { ...w.hero, x: 25, safe: { x: 25, y: 0 } } };
    // walk up to the gully edge; the bridge gives way on the way
    for (let i = 0; i < 600 && w.hero.x < 27.5; i++) tick({ move: 1 });
    tick({}, 120);
    expect(top(w, 'bridge')).toBeLessThan(-3);
    // rewind until it is back in place, hold it, cross
    for (let i = 0; i < 600 && top(w, 'bridge') < 0; i++) tick({ rewind: true });
    expect(top(w, 'bridge')).toBeCloseTo(0);
    tick({ hold: true });
    tick({});
    expect(w.drum.holding).toBe('bridge');
    for (let i = 0; i < 600 && w.hero.x < 37; i++) tick({ move: 1 });
    expect(w.hero.x).toBeGreaterThanOrEqual(37);
    expect(w.hero.y).toBeCloseTo(0);
  });

  it('without the drum, the hero falls with the bridge and is put back on the near side', () => {
    let w = newWorld(DAURA);
    w = { ...w, hero: { ...w.hero, x: 24, y: 0, safe: { x: 24, y: 0 } } };
    for (let i = 0; i < 400; i++) w = stepWorld(w, { ...none, move: 1, run: true }, DAURA, DT);
    expect(w.hero.x).toBeLessThan(29);
  });

  it('the hoist is slow, but hastening it brings it down, and it carries the hero up to the courtyard wall', () => {
    let w = newWorld(DAURA);
    const tick = (i: Partial<WorldInput>, n = 1) => {
      for (let k = 0; k < n; k++) w = stepWorld(w, { ...none, ...i }, DAURA, DT);
    };
    w = { ...w, hero: { ...w.hero, x: 61.5, y: 2.3, safe: { x: 61.5, y: 0 } } };
    tick({}, 60 * 6); // let the hoist get partway up
    expect(top(w, 'hoist')).toBeGreaterThan(1);
    // hasten until it is back at the bottom, then hold it there and step on
    for (let i = 0; i < 1200 && top(w, 'hoist') > 0.02; i++) tick({ hasten: true });
    tick({ hold: true });
    tick({});
    for (let i = 0; i < 200 && w.hero.x < 65; i++) tick({ move: 1 });
    expect(w.hero.standingOn).toBe('hoist');
    // let go, hasten it up, and walk onto the wall
    tick({ hold: true });
    tick({});
    for (let i = 0; i < 1200 && top(w, 'hoist') < 4.58; i++) tick({ hasten: true });
    tick({ hold: true });
    tick({});
    for (let i = 0; i < 200 && w.hero.x < 67; i++) tick({ move: 1 });
    tick({}, 30);
    expect(w.hero.y).toBeCloseTo(4.6);
    // and on to the well
    for (let i = 0; i < 1200 && !atGoal(w.hero, DAURA); i++) tick({ move: 1, jump: i % 50 < 25 });
    expect(atGoal(w.hero, DAURA)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { DAURA, type Level } from './level';
import { spawnHero, step, type Hero, type Input } from './physics';

const DT = 1 / 60;
const none: Input = { move: 0, up: false, down: false, jump: false, run: false };

function run(h: Hero, input: Partial<Input>, frames: number, level: Level = DAURA) {
  for (let i = 0; i < frames; i++) h = step(h, { ...none, ...input }, level, DT);
  return h;
}

describe('hero movement', () => {
  it('lands on the street from the spawn point', () => {
    const h = run(spawnHero(DAURA), {}, 30);
    expect(h.onGround).toBe(true);
    expect(h.y).toBeCloseTo(0);
    expect(h.mode).toBe('idle');
  });

  it('walks, runs faster and faces the way it moves', () => {
    const start = run(spawnHero(DAURA), {}, 30);
    const walked = run(start, { move: 1 }, 30);
    const ran = run(start, { move: 1, run: true }, 30);
    expect(walked.x).toBeGreaterThan(start.x);
    expect(ran.x).toBeGreaterThan(walked.x);
    expect(ran.mode).toBe('run');
    expect(run(walked, { move: -1 }, 5).facing).toBe(-1);
  });

  it('needs a fresh press for each jump', () => {
    const start = run(spawnHero(DAURA), {}, 30);
    const up = run(start, { jump: true }, 10);
    expect(up.y).toBeGreaterThan(1);
    const held = run(up, { jump: true }, 120);
    expect(held.onGround).toBe(true);
    expect(run(held, { jump: true }, 5).y).toBeCloseTo(held.y); // still held: no second jump
  });

  it('cannot walk through the city wall', () => {
    let h = run(spawnHero(DAURA), {}, 30);
    h = { ...h, x: 36, safe: { x: 36, y: 0 } };
    h = run(h, { move: 1 }, 120);
    expect(h.x).toBeLessThanOrEqual(40);
  });

  it('climbs the rope over the wall', () => {
    let h = run(spawnHero(DAURA), {}, 30);
    h = { ...h, x: 39.4 };
    h = run(h, { up: true }, 10);
    expect(h.mode).toBe('climb');
    h = run(h, { up: true }, 180);
    h = run(h, {}, 30);
    expect(h.onGround).toBe(true);
    expect(h.y).toBeCloseTo(6);
    expect(h.x).toBeGreaterThan(40);
  });

  it('puts the hero back at the last safe spot after a fall into the gully', () => {
    let h = run(spawnHero(DAURA), {}, 30);
    h = { ...h, x: 27, safe: { x: 27, y: 0 } };
    h = run(h, { move: 1 }, 25);
    h = run(h, {}, 200);
    expect(h.onGround).toBe(true);
    expect(h.y).toBeGreaterThanOrEqual(0);
  });

  it('cannot jump the gully: it takes the drum', () => {
    let h = run(spawnHero(DAURA), {}, 30);
    h = { ...h, x: 22, safe: { x: 22, y: 0 } };
    for (let i = 0; i < 300 && h.x < 28.2; i++) h = step(h, { ...none, move: 1, run: true }, DAURA, DT);
    h = run(h, { move: 1, run: true, jump: true }, 40);
    h = run(h, { move: 1, run: true }, 120);
    expect(h.x).toBeLessThan(36); // back on the near side
  });
});

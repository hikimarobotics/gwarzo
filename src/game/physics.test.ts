import { describe, expect, it } from 'vitest';
import { DAURA, type Level } from './level';
import { atGoal, spawnHero, step, type Hero, type Input } from './physics';

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

  it('can reach the well from the start by walking, jumping and climbing', () => {
    // a simple auto-player: hold right, jump when blocked or at an edge, climb any rope it meets
    let h = run(spawnHero(DAURA), {}, 30);
    let jumpFor = 0;
    for (let i = 0; i < 60 * 60 && !atGoal(h, DAURA); i++) {
      const blocked = h.onGround && Math.abs(h.vx) < 0.5 && i > 40;
      const edge = h.onGround && !DAURA.boxes.some((b) => h.x + 1.2 > b.x && h.x + 1.2 < b.x + b.w && Math.abs(b.y + b.h - h.y) < 0.4);
      const rope = DAURA.climbs.find((c) => c.kind === 'rope' && Math.abs(h.x - c.x) < 0.5);
      if (jumpFor === 0 && (blocked || edge) && !rope) jumpFor = 30;
      const jump = jumpFor > 0;
      if (jumpFor > 0) jumpFor--;
      h = step(h, { ...none, move: h.climbing ? 0 : 1, run: true, jump: jump && jumpFor > 0, up: !!rope || !!h.climbing }, DAURA, DT);
    }
    expect(atGoal(h, DAURA)).toBe(true);
  });
});

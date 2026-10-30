import type { Box, Climb, Level } from './level';

// The hero's movement on the play plane: walking, running, jumping, climbing, falling. Pure functions over plain
// data, so it runs the same in tests as in the game, and later the time system can record and replay it.

export interface Input {
  move: number; // -1 (left) .. 1 (right)
  up: boolean;
  down: boolean;
  jump: boolean; // held this frame
  run: boolean;
}

export type Mode = 'idle' | 'walk' | 'run' | 'jump' | 'fall' | 'climb';

export interface Hero {
  x: number; // centre
  y: number; // feet
  vx: number;
  vy: number;
  facing: 1 | -1;
  onGround: boolean;
  climbing: Climb | null;
  mode: Mode;
  /** Was jump held last frame (a jump needs a fresh press). */
  jumpHeld: boolean;
  /** Seconds since leaving the ground, for a little forgiveness on late jumps. */
  airTime: number;
  safe: { x: number; y: number };
}

export const HERO_W = 0.6;
export const HERO_H = 1.6;
export const WALK = 4;
export const RUN = 7;
export const CLIMB = 3;
export const GRAVITY = 30;
export const JUMP = 12.5;
const COYOTE = 0.1;
const ACCEL = 40;

export function spawnHero(level: Level): Hero {
  const { x, y } = level.spawn;
  return { x, y, vx: 0, vy: 0, facing: 1, onGround: false, climbing: null, mode: 'idle', jumpHeld: false, airTime: 0, safe: { x, y } };
}

const overlaps = (h: { x: number; y: number }, b: Box) =>
  h.x + HERO_W / 2 > b.x && h.x - HERO_W / 2 < b.x + b.w && h.y + HERO_H > b.y && h.y < b.y + b.h;

function climbAt(level: Level, x: number, y: number): Climb | null {
  return level.climbs.find((c) => Math.abs(x - c.x) < 0.6 && y >= c.y - 0.1 && y < c.y + c.h) ?? null;
}

/** Advances the hero by dt seconds. Returns a new hero; the old one is left as it was. */
export function step(prev: Hero, input: Input, level: Level, dt: number): Hero {
  const h: Hero = { ...prev, safe: { ...prev.safe } };
  const pressedJump = input.jump && !prev.jumpHeld;
  h.jumpHeld = input.jump;
  if (input.move !== 0) h.facing = input.move > 0 ? 1 : -1;

  // Grab a rope or ladder by pressing up (or down from the top) while standing at it.
  if (!h.climbing && (input.up || (input.down && h.onGround))) {
    const c = climbAt(level, h.x, input.down ? h.y - 0.2 : h.y);
    if (c) {
      h.climbing = c;
      h.x = c.x;
      h.vx = 0;
      h.vy = 0;
    }
  }

  if (h.climbing) {
    const c = h.climbing;
    h.vy = (input.up ? CLIMB : 0) - (input.down ? CLIMB : 0);
    h.y += h.vy * dt;
    if (pressedJump) {
      // jump off sideways
      h.climbing = null;
      h.vy = JUMP * 0.8;
      h.vx = input.move * WALK;
    } else if (h.y >= c.y + c.h) {
      // over the top: step off onto the ledge beside it
      const top = c.y + c.h;
      const ledge = level.boxes.find((b) => Math.abs(b.y + b.h - top) < 0.5 && b.x - 1 < c.x && c.x < b.x + b.w + 1);
      h.climbing = null;
      h.y = ledge ? ledge.y + ledge.h : top;
      h.vy = 0;
      if (ledge) h.x = c.x < ledge.x + ledge.w / 2 ? ledge.x + HERO_W : ledge.x + ledge.w - HERO_W;
      else h.x += h.facing * 0.9;
    } else if (h.y <= c.y) {
      h.climbing = null;
      h.y = c.y;
    }
    h.onGround = false;
    h.mode = h.climbing ? 'climb' : 'fall';
    if (h.climbing) return h;
  }

  // Horizontal: ease toward the target speed.
  const target = input.move * (input.run ? RUN : WALK);
  const dv = target - h.vx;
  h.vx += Math.sign(dv) * Math.min(Math.abs(dv), ACCEL * dt);

  // Jump, with a short grace period after walking off an edge.
  h.airTime = h.onGround ? 0 : h.airTime + dt;
  if (pressedJump && h.airTime < COYOTE) {
    h.vy = JUMP;
    h.onGround = false;
    h.airTime = COYOTE;
  }
  // Let go of jump early for a shorter hop.
  if (!input.jump && h.vy > 0) h.vy -= GRAVITY * dt;
  h.vy -= GRAVITY * dt;

  // Move one axis at a time and push out of anything solid.
  h.x += h.vx * dt;
  for (const b of level.boxes) {
    if (!overlaps(h, b)) continue;
    // small ledges (a step) are walked up rather than bumped into
    const stepUp = b.y + b.h - h.y;
    if (stepUp > 0 && stepUp <= 0.35 && h.onGround) {
      h.y = b.y + b.h;
      continue;
    }
    h.x = h.vx > 0 ? b.x - HERO_W / 2 : b.x + b.w + HERO_W / 2;
    h.vx = 0;
  }
  h.x = Math.min(Math.max(h.x, level.bounds.minX), level.bounds.maxX);

  h.y += h.vy * dt;
  h.onGround = false;
  for (const b of level.boxes) {
    if (!overlaps(h, b)) continue;
    if (h.vy <= 0) {
      h.y = b.y + b.h;
      h.onGround = true;
    } else {
      h.y = b.y - HERO_H;
    }
    h.vy = 0;
  }

  if (h.onGround) h.safe = { x: h.x, y: h.y };
  if (h.y < level.killY) {
    h.x = h.safe.x;
    h.y = h.safe.y;
    h.vx = 0;
    h.vy = 0;
  }

  const speed = Math.abs(h.vx);
  h.mode = !h.onGround ? (h.vy > 0 ? 'jump' : 'fall') : speed > WALK + 0.5 ? 'run' : speed > 0.2 ? 'walk' : 'idle';
  return h;
}

/** True once the hero reaches the chapter's goal. */
export const atGoal = (h: Hero, level: Level) => Math.abs(h.x - level.goal.x) < 1.5 && Math.abs(h.y - level.goal.y) < 1;

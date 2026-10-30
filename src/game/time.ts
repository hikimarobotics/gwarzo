import type { Box, TimeThing } from './level';

// The drum's power over time. Every time object runs on its own clock, and its shape at any moment is a pure
// function of that clock (`shapeOf`). The drum never stores history: it only sets how fast each clock runs, so a
// rewind is exact however long you hold it.
//
// Three verbs:
// - rewind (held): the target's clock runs backwards
// - hold (toggle): the target's clock stops until you let go or hold something else
// - hasten (held): the target's clock runs fast

export type Verb = 'rewind' | 'hold' | 'hasten';

export const RATE = { rewind: -1.5, hasten: 3 } as const;
/** How far the drum reaches, from the hero to the nearest edge of a time object. */
export const REACH = 9;

export interface Clock {
  t: number;
  /** False until the object's story starts (the bridge waits for the hero to come near). */
  running: boolean;
}

export interface Drum {
  /** The time object the drum would act on now (the nearest in reach). */
  target: string | null;
  /** The object being held still, if any. */
  holding: string | null;
  /** The verb being played this frame, if any (hold shows only on the frame it was pressed). */
  playing: Verb | null;
  holdPressed: boolean;
}

export interface DrumInput {
  rewind: boolean;
  hold: boolean;
  hasten: boolean;
}

export const newDrum = (): Drum => ({ target: null, holding: null, playing: null, holdPressed: false });

export function newClocks(things: TimeThing[]): Record<string, Clock> {
  return Object.fromEntries(things.map((t) => [t.id, { t: 0, running: t.kind !== 'bridge' }]));
}

/** 0..1 for something that rests, rises over `trip`, rests, and falls back, forever (and backwards too). */
function upAndDown(t: number, trip: number, rest: number) {
  const period = 2 * (trip + rest);
  const m = ((t % period) + period) % period;
  if (m < rest) return 0;
  if (m < rest + trip) return (m - rest) / trip;
  if (m < 2 * rest + trip) return 1;
  return 1 - (m - 2 * rest - trip) / trip;
}

export interface Shape {
  box: Box;
  /** Visual only: how far the object has tipped, in radians. */
  tilt: number;
  /** Visual only: 0..1, how hard it is shaking (the bridge creaking). */
  shake: number;
  /** False once it can no longer be stood on (the bridge lying in the gully). */
  solid: boolean;
}

const GRAVITY = 30;

/** What a time object looks like at time t on its clock. */
export function shapeOf(thing: TimeThing, t: number): Shape {
  if (thing.kind === 'bridge') {
    const fall = Math.max(0, t - thing.creak);
    const dy = Math.min(thing.drop, 0.5 * GRAVITY * fall * fall);
    const shake = t > 0 && t < thing.creak ? t / thing.creak : 0;
    return {
      box: { x: thing.x, y: thing.y - dy, w: thing.w, h: thing.h, kind: 'bridge', id: thing.id },
      tilt: Math.min(0.35, (dy / thing.drop) * 0.35),
      shake,
      solid: dy < 1,
    };
  }
  const u = upAndDown(t, thing.trip, thing.rest);
  // ease at each end, like a load swinging to a stop
  const eased = u * u * (3 - 2 * u);
  return {
    box: { x: thing.x, y: thing.low + (thing.high - thing.low) * eased, w: thing.w, h: thing.h, kind: 'hoist', id: thing.id },
    tilt: 0,
    shake: 0,
    solid: true,
  };
}

/** Distance from a point to the nearest edge of a box (0 inside it). */
function distance(x: number, y: number, b: Box) {
  const dx = Math.max(b.x - x, 0, x - (b.x + b.w));
  const dy = Math.max(b.y - y, 0, y - (b.y + b.h));
  return Math.hypot(dx, dy);
}

/** Works out the drum's target and verb this frame. */
export function playDrum(prev: Drum, input: DrumInput, things: TimeThing[], clocks: Record<string, Clock>, at: { x: number; y: number }): Drum {
  let target: string | null = null;
  let best = REACH;
  for (const thing of things) {
    const d = distance(at.x, at.y + 0.8, shapeOf(thing, clocks[thing.id].t).box);
    if (d <= best) {
      best = d;
      target = thing.id;
    }
  }
  let holding = prev.holding;
  const pressed = input.hold && !prev.holdPressed;
  if (pressed) holding = holding && holding === target ? null : target;
  const playing: Verb | null = !target ? null : input.rewind ? 'rewind' : input.hasten ? 'hasten' : pressed && holding ? 'hold' : null;
  return { target, holding, playing, holdPressed: input.hold };
}

/** How fast an object's clock runs this frame, given the drum. */
export function rateOf(id: string, drum: Drum) {
  if (drum.target === id && drum.playing === 'rewind') return RATE.rewind;
  if (drum.target === id && drum.playing === 'hasten') return RATE.hasten;
  if (drum.holding === id) return 0;
  return 1;
}

/** Advances every clock by dt at its rate. Rewinding stops at the start of an object's story. */
export function tickClocks(clocks: Record<string, Clock>, things: TimeThing[], drum: Drum, heroX: number, dt: number) {
  const next: Record<string, Clock> = {};
  for (const thing of things) {
    const c = clocks[thing.id];
    const running = c.running || (thing.kind === 'bridge' && heroX > thing.trigger);
    const rate = running ? rateOf(thing.id, drum) : 0;
    let t = c.t + rate * dt;
    if (thing.kind === 'bridge') t = Math.min(Math.max(t, 0), thing.creak + 3); // past 3s it is long since fallen
    next[thing.id] = { t, running };
  }
  return next;
}

/** The solid boxes of every time object right now. */
export function solidBoxes(things: TimeThing[], clocks: Record<string, Clock>): Box[] {
  return things.map((t) => shapeOf(t, clocks[t.id].t)).filter((s) => s.solid).map((s) => s.box);
}

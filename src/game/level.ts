// The Daura slice, laid out on the side-on play plane. x runs left to right, y is up, and every solid thing is a
// box the hero can stand on or bump into. Scenery (Daura.tsx) is built from the same data, so what you see is what
// you collide with.

export interface Box {
  x: number; // left edge
  y: number; // bottom edge
  w: number;
  h: number;
  kind: 'ground' | 'house' | 'wall' | 'crate' | 'well' | 'bridge' | 'hoist';
  /** Set on boxes that belong to a time object, so the hero can ride them. */
  id?: string;
}

/** A rope or ladder the hero can climb: a vertical strip from y to y + h, centred on x. */
export interface Climb {
  x: number;
  y: number;
  h: number;
  kind: 'rope' | 'ladder';
}

/**
 * Things the drum can bend. Each one's state is a pure function of its own clock, so rewinding is exact: the drum
 * only changes how fast (and which way) that clock runs.
 */
export type TimeThing =
  | {
      id: string;
      kind: 'bridge';
      /** The plank's span when intact. */
      x: number;
      y: number;
      w: number;
      h: number;
      /** Its clock starts once the hero passes this x. */
      trigger: number;
      /** Seconds of creaking before it gives way. */
      creak: number;
      /** How far it falls before landing in the gully. */
      drop: number;
    }
  | {
      id: string;
      kind: 'hoist';
      x: number;
      w: number;
      h: number;
      /** Bottom edge of the platform at its lowest and highest. */
      low: number;
      high: number;
      /** Seconds for one trip, up or down. */
      trip: number;
      /** Seconds it rests at the top and at the bottom. */
      rest: number;
    };

export interface Level {
  name: string;
  spawn: { x: number; y: number };
  bounds: { minX: number; maxX: number };
  /** Falling below this puts the hero back at the last safe spot. */
  killY: number;
  boxes: Box[];
  climbs: Climb[];
  things: TimeThing[];
  /** Where the chapter's goal sits (the well at Daura). */
  goal: { x: number; y: number };
}

export const DAURA: Level = {
  name: 'The Well at Daura',
  spawn: { x: 2, y: 0 },
  bounds: { minX: -2, maxX: 96 },
  killY: -8,
  boxes: [
    // the streets, split by a gully too wide to jump (an old plank bridge spans it, for now)
    { x: -10, y: -4, w: 38, h: 4, kind: 'ground' },
    { x: 36, y: -4, w: 28, h: 4, kind: 'ground' },
    { x: 66, y: -4, w: 40, h: 4, kind: 'ground' },
    // a family compound: low house, then a taller one to hop up onto
    { x: 8, y: 0, w: 4, h: 1.4, kind: 'house' },
    { x: 13, y: 0, w: 4, h: 2.4, kind: 'house' },
    // trader's crates by the market
    { x: 22, y: 0, w: 1.2, h: 1.2, kind: 'crate' },
    { x: 23.2, y: 0, w: 1.2, h: 2.4, kind: 'crate' },
    // the city wall: too high to jump, climbed by the rope
    { x: 40, y: 0, w: 2.4, h: 6, kind: 'wall' },
    // rooftops inside the wall, a run of jumps
    { x: 46, y: 0, w: 3.5, h: 2.2, kind: 'house' },
    { x: 51, y: 0, w: 3.5, h: 3.2, kind: 'house' },
    { x: 56.5, y: 0, w: 4, h: 2.2, kind: 'house' },
    // the courtyard wall around the well, reached by the hoist
    { x: 66, y: 0, w: 3, h: 4.6, kind: 'wall' },
    // the well's raised lip
    { x: 82, y: 0, w: 3, h: 0.9, kind: 'well' },
  ],
  climbs: [
    { x: 39.4, y: 0, h: 6.2, kind: 'rope' },
    { x: 61, y: 0, h: 2.2, kind: 'ladder' },
  ],
  things: [
    { id: 'bridge', kind: 'bridge', x: 27.8, y: -0.25, w: 8.4, h: 0.25, trigger: 20, creak: 1.2, drop: 5.5 },
    { id: 'hoist', kind: 'hoist', x: 64, w: 2, h: 0.3, low: -0.3, high: 4.3, trip: 9, rest: 2 },
  ],
  goal: { x: 83.5, y: 0.9 },
};

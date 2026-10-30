import { describe, expect, it } from 'vitest';
import { DAURA, type TimeThing } from './level';
import { HERO_H } from './physics';
import { newClocks, newDrum, playDrum, rateOf, shapeOf, tickClocks, type DrumInput } from './time';

const bridge = DAURA.things.find((t) => t.id === 'bridge') as Extract<TimeThing, { kind: 'bridge' }>;
const hoist = DAURA.things.find((t) => t.id === 'hoist') as Extract<TimeThing, { kind: 'hoist' }>;
const quiet: DrumInput = { rewind: false, hold: false, hasten: false };

describe('time objects', () => {
  it('the bridge creaks, then falls into the gully and stops being solid', () => {
    expect(shapeOf(bridge, 0).box.y).toBe(bridge.y);
    const creaking = shapeOf(bridge, bridge.creak / 2);
    expect(creaking.box.y).toBe(bridge.y);
    expect(creaking.shake).toBeGreaterThan(0);
    const fallen = shapeOf(bridge, bridge.creak + 2);
    expect(fallen.box.y).toBeCloseTo(bridge.y - bridge.drop);
    expect(fallen.solid).toBe(false);
  });

  it('the hoist rises to the top of the courtyard wall and comes back down', () => {
    const top = (t: number) => {
      const b = shapeOf(hoist, t).box;
      return b.y + b.h;
    };
    const period = 2 * (hoist.trip + hoist.rest);
    expect(top(0)).toBeCloseTo(0);
    expect(top(hoist.rest / 2)).toBeCloseTo(0); // resting at the bottom
    expect(top(hoist.rest + hoist.trip)).toBeCloseTo(4.6);
    expect(top(hoist.rest * 1.5 + hoist.trip)).toBeCloseTo(4.6); // resting at the top
    expect(top(period)).toBeCloseTo(0);
    expect(top(-3)).toBeCloseTo(top(period - 3)); // rewinding past the start just runs it backwards
  });
});

describe('the drum', () => {
  const near = (x: number) => ({ x, y: 0 });

  it('targets the nearest time object in reach, and nothing out of reach', () => {
    const clocks = newClocks(DAURA.things);
    expect(playDrum(newDrum(), quiet, DAURA.things, clocks, near(25)).target).toBe('bridge');
    expect(playDrum(newDrum(), quiet, DAURA.things, clocks, near(60)).target).toBe('hoist');
    expect(playDrum(newDrum(), quiet, DAURA.things, clocks, near(2)).target).toBeNull();
  });

  it('rewind runs the target backwards and hasten runs it fast', () => {
    const clocks = newClocks(DAURA.things);
    const rewind = playDrum(newDrum(), { ...quiet, rewind: true }, DAURA.things, clocks, near(60));
    expect(rewind.playing).toBe('rewind');
    expect(rateOf('hoist', rewind)).toBeLessThan(0);
    expect(rateOf('bridge', rewind)).toBe(1); // only the target
    const hasten = playDrum(newDrum(), { ...quiet, hasten: true }, DAURA.things, clocks, near(60));
    expect(rateOf('hoist', hasten)).toBeGreaterThan(1);
  });

  it('hold toggles on a fresh press and keeps holding after you walk away', () => {
    const clocks = newClocks(DAURA.things);
    let drum = playDrum(newDrum(), { ...quiet, hold: true }, DAURA.things, clocks, near(60));
    expect(drum.holding).toBe('hoist');
    expect(drum.playing).toBe('hold');
    drum = playDrum(drum, { ...quiet, hold: true }, DAURA.things, clocks, near(60)); // still held down: no change
    expect(drum.holding).toBe('hoist');
    drum = playDrum(drum, quiet, DAURA.things, clocks, near(80));
    expect(drum.holding).toBe('hoist');
    expect(rateOf('hoist', drum)).toBe(0);
    drum = playDrum(drum, { ...quiet, hold: true }, DAURA.things, clocks, near(60));
    expect(drum.holding).toBeNull();
  });

  it("the bridge's clock waits for the hero, and rewinding stops at the start of its story", () => {
    let clocks = newClocks(DAURA.things);
    const drum = newDrum();
    clocks = tickClocks(clocks, DAURA.things, drum, 5, 1);
    expect(clocks.bridge.t).toBe(0);
    clocks = tickClocks(clocks, DAURA.things, drum, bridge.trigger + 1, 2);
    expect(clocks.bridge.t).toBe(2);
    const rewinding = { ...drum, target: 'bridge', playing: 'rewind' as const };
    clocks = tickClocks(clocks, DAURA.things, rewinding, bridge.trigger + 1, 10);
    expect(clocks.bridge.t).toBe(0);
  });

  it('keeps the hero clear of a rising hoist (sanity check on sizes)', () => {
    expect(shapeOf(hoist, hoist.trip).box.y + hoist.h).toBeLessThan(4.6 + HERO_H);
  });
});

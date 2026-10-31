import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { input, listenToKeyboard, readInput } from '../game/input';
import type { Level } from '../game/level';
import { atGoal, spawnHero, type Hero as HeroState } from '../game/physics';
import type { Verb } from '../game/time';
import { newWorld, stepWorld, type World } from '../game/world';
import { beat, unlockAudioOnGesture } from '../ui/drumSound';
import { Daura } from './Daura';
import { Hero } from './Hero';
import { TimeThings } from './TimeThings';
import { PALETTE } from './toon';

// The running chapter: a fixed-step world (drum, time objects, hero), the street and a side-on camera that follows.

const STEP = 1 / 60;
/** ?debug puts the live world on `window.gwarzo`, for browser tests. */
const DEBUG = new URLSearchParams(window.location.search).has('debug');
/** Seconds between drum beats while a verb is played. */
const BEAT = { rewind: 0.18, hasten: 0.12, hold: 1 } as const;

/** What the HUD shows about the drum. */
export interface DrumView {
  target: string | null;
  holding: string | null;
  playing: Verb | null;
}

function spawnAt(level: Level) {
  const h = spawnHero(level);
  const start = Number(new URLSearchParams(window.location.search).get('start'));
  if (Number.isFinite(start) && start !== 0) {
    h.x = start;
    h.y = 8;
  }
  return h;
}

const sameView = (a: DrumView, b: DrumView) => a.target === b.target && a.holding === b.holding && a.playing === b.playing;

export function Game({ level, onGoal, onDrum }: { level: Level; onGoal: () => void; onDrum: (v: DrumView) => void }) {
  // ?start=<x> drops the hero further along the street, for testing a stretch without replaying it all
  const world = useRef<World>(newWorld(level, spawnAt(level)));
  const hero = useRef<HeroState>(world.current.hero);
  const drumming = useRef(0);
  const view = useRef<DrumView>({ target: null, holding: null, playing: null });
  const sinceBeat = useRef(0);
  const acc = useRef(0);
  const reached = useRef(false);
  const look = useRef(new THREE.Vector3(level.spawn.x, 1.5, 0));
  const { camera } = useThree();

  useEffect(() => {
    unlockAudioOnGesture();
    return listenToKeyboard();
  }, []);

  useFrame((_, dt) => {
    readInput();
    acc.current = Math.min(acc.current + dt, 0.25);
    let held: Verb | null = null;
    while (acc.current >= STEP) {
      world.current = stepWorld(world.current, input, level, STEP);
      const playing = world.current.drum.playing;
      if (playing === 'hold') {
        beat('hold', true);
        drumming.current = 0.4;
      } else if (playing) held = playing;
      acc.current -= STEP;
    }
    const w = world.current;
    hero.current = w.hero;
    if (DEBUG) (window as unknown as { gwarzo: World }).gwarzo = w;

    // The drum: beats while a verb is played, and the hero taps it.
    sinceBeat.current += dt;
    if (held) {
      drumming.current = 0.25;
      if (sinceBeat.current >= BEAT[held]) {
        beat(held, sinceBeat.current > 0.5);
        sinceBeat.current = 0;
      }
    } else {
      drumming.current = Math.max(0, drumming.current - dt);
    }
    const next: DrumView = { target: w.drum.target, holding: w.drum.holding, playing: held };
    if (!sameView(view.current, next)) {
      view.current = next;
      onDrum(next);
    }

    const h = w.hero;
    if (!reached.current && atGoal(h, level)) {
      reached.current = true;
      onGoal();
    }

    // Side-on camera: a little ahead of where the hero faces, easing up when they climb high.
    // On a phone held upright the view is narrow, so pull back and keep the hero nearer the middle.
    const portrait = camera instanceof THREE.PerspectiveCamera && camera.aspect < 1;
    const k = 1 - Math.exp(-4 * Math.min(dt, 0.1));
    const aim = new THREE.Vector3(h.x + h.facing * (portrait ? 0.8 : 2.2), Math.max(1.6, h.y + 1.4), 0);
    look.current.lerp(aim, k);
    camera.position.set(look.current.x, look.current.y + 2.2, portrait ? 22 : 13);
    camera.lookAt(look.current.x, look.current.y + 0.2, 0);
  });

  return (
    <>
      <color attach="background" args={[PALETTE.sky]} />
      <fog attach="fog" args={[PALETTE.sky, 30, 90]} />
      <hemisphereLight args={['#ffe2b0', '#8a5a3a', 1.1]} />
      <directionalLight
        position={[30, 25, 18]}
        intensity={2.2}
        color="#ffd9a0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={20}
        shadow-camera-bottom={-10}
        shadow-camera-far={120}
        shadow-bias={-0.0005}
      />
      {/* the low harmattan sun */}
      <mesh position={[60, 30, -80]}>
        <circleGeometry args={[6, 32]} />
        <meshBasicMaterial color="#fff1c9" fog={false} />
      </mesh>
      <Daura level={level} />
      <TimeThings level={level} world={world} />
      <Hero state={hero} drumming={drumming} />
    </>
  );
}

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { input, listenToKeyboard, readInput } from '../game/input';
import type { Level } from '../game/level';
import { atGoal, spawnHero, step, type Hero as HeroState } from '../game/physics';
import { Daura } from './Daura';
import { Hero } from './Hero';
import { PALETTE } from './toon';

// The running chapter: fixed-step physics, the hero, the street and a side-on camera that follows along.

const STEP = 1 / 60;

function spawnAt(level: Level) {
  const h = spawnHero(level);
  const start = Number(new URLSearchParams(window.location.search).get('start'));
  if (Number.isFinite(start) && start !== 0) {
    h.x = start;
    h.y = 8;
  }
  return h;
}

export function Game({ level, onGoal }: { level: Level; onGoal: () => void }) {
  // ?start=<x> drops the hero further along the street, for testing a stretch without replaying it all
  const hero = useRef<HeroState>(spawnAt(level));
  const acc = useRef(0);
  const reached = useRef(false);
  const look = useRef(new THREE.Vector3(level.spawn.x, 1.5, 0));
  const { camera } = useThree();

  useEffect(() => listenToKeyboard(), []);

  useFrame((_, dt) => {
    readInput();
    acc.current = Math.min(acc.current + dt, 0.25);
    while (acc.current >= STEP) {
      hero.current = step(hero.current, input, level, STEP);
      acc.current -= STEP;
    }
    const h = hero.current;
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
      <Hero state={hero} />
    </>
  );
}

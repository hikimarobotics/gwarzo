import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Level, TimeThing } from '../game/level';
import { shapeOf } from '../game/time';
import type { World } from '../game/world';
import { PALETTE, toon } from './toon';

// The things the drum can bend, drawn from their shape at the current moment on their own clock, with a glow that
// shows what the drum is doing to them: white when targeted, blue rewinding, gold held, orange hastened.

const GLOW = { target: '#fff4d6', rewind: '#5aa9ff', hold: '#f4c542', hasten: '#ff8a3d' };

function glowFor(id: string, world: World) {
  const d = world.drum;
  if (d.target === id && d.playing === 'rewind') return GLOW.rewind;
  if (d.target === id && d.playing === 'hasten') return GLOW.hasten;
  if (d.holding === id) return GLOW.hold;
  if (d.target === id) return GLOW.target;
  return null;
}

function Bridge({ w }: { w: number }) {
  const planks = Math.floor(w / 0.42);
  return (
    <group>
      {Array.from({ length: planks }, (_, i) => (
        <mesh key={i} material={toon(i % 3 ? PALETTE.wood : '#80522f')} position={[-w / 2 + 0.21 + i * 0.42, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.38, 0.22, 2.6]} />
        </mesh>
      ))}
      {[-1.25, 1.25].map((z) => (
        <mesh key={z} material={toon(PALETTE.straw)} position={[0, 0.12, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, w, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function Hoist({ w, ropes }: { w: number; ropes: RefObject<THREE.Group | null> }) {
  return (
    <group>
      <mesh material={toon(PALETTE.wood)} castShadow receiveShadow>
        <boxGeometry args={[w, 0.3, 2.4]} />
      </mesh>
      {/* unit-height ropes, stretched each frame up to the frame's beam */}
      <group ref={ropes}>
        {[-1, 1].map((s) =>
          [-1, 1].map((z) => (
            <mesh key={`${s}${z}`} material={toon(PALETTE.straw)} position={[s * (w / 2 - 0.1), 0.5, z * 1.1]}>
              <cylinderGeometry args={[0.025, 0.025, 1, 4]} />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
}

function Thing({ thing, world }: { thing: TimeThing; world: RefObject<World> }) {
  const root = useRef<THREE.Group>(null!);
  const glow = useRef<THREE.Mesh>(null!);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null!);
  const ropes = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const w = world.current;
    const s = shapeOf(thing, w.clocks[thing.id].t);
    const b = s.box;
    const jitter = s.shake * 0.04 * Math.sin(clock.elapsedTime * 60);
    root.current.position.set(b.x + b.w / 2 + jitter, b.y + b.h / 2, 0);
    root.current.rotation.z = -s.tilt;
    if (thing.kind === 'hoist' && ropes.current) ropes.current.scale.y = Math.max(0.01, thing.high + 4 - b.y);
    const color = glowFor(thing.id, w);
    glow.current.visible = !!color;
    if (color) {
      glowMat.current.color.set(color);
      glowMat.current.opacity = 0.28 + Math.sin(clock.elapsedTime * 8) * 0.08;
    }
  });

  const shape = shapeOf(thing, 0).box;
  return (
    <group ref={root}>
      {thing.kind === 'bridge' ? <Bridge w={shape.w} /> : <Hoist w={shape.w} ropes={ropes} />}
      <mesh ref={glow} visible={false}>
        <boxGeometry args={[shape.w + 0.3, shape.h + 0.3, 2.9]} />
        <meshBasicMaterial ref={glowMat} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

/** The frame of the hoist, which stays put while the platform moves. */
function HoistFrame({ thing }: { thing: Extract<TimeThing, { kind: 'hoist' }> }) {
  const cx = thing.x + thing.w / 2;
  const topY = thing.high + 4;
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} material={toon(PALETTE.wood)} position={[cx + s * (thing.w / 2 + 0.2), topY / 2, -1.4]} castShadow>
          <boxGeometry args={[0.2, topY, 0.2]} />
        </mesh>
      ))}
      <mesh material={toon(PALETTE.wood)} position={[cx, topY, -0.2]} castShadow>
        <boxGeometry args={[thing.w + 0.8, 0.25, 2.8]} />
      </mesh>
      <mesh material={toon(PALETTE.straw)} position={[cx, topY + 0.2, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 2.4, 10]} />
      </mesh>
    </group>
  );
}

export function TimeThings({ level, world }: { level: Level; world: RefObject<World> }) {
  return (
    <group>
      {level.things.map((t) => (
        <group key={t.id}>
          <Thing thing={t} world={world} />
          {t.kind === 'hoist' && <HoistFrame thing={t} />}
        </group>
      ))}
    </group>
  );
}

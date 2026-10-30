import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { Box, Climb, Level } from '../game/level';
import { PALETTE, toon } from './toon';

// Daura, built from the level data in code: mud-brick houses with pinnacles, the city wall, the market, the well,
// and a skyline of the town behind the play path. Everything you can stand on comes from `level.boxes`.

const FRONT = 1.5; // the street's front edge (toward the camera)
const BACK = -2; // its back edge

/** A small deterministic random, so the town looks the same every visit. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Pinnacles({ x, y, w, d, z, color, every = 0 }: { x: number; y: number; w: number; d: number; z: number; color: string; every?: number }) {
  // zanko: the horn-like pinnacles on the corners of a Hausa roof (and along the wall when `every` is set)
  const xs = every > 0 ? Array.from({ length: Math.floor(w / every) + 1 }, (_, i) => x + i * every) : [x, x + w];
  return (
    <>
      {xs.map((px) => (
        <mesh key={px} material={toon(color)} position={[px, y + 0.22, z + d / 2 - 0.05]} castShadow>
          <coneGeometry args={[0.13, 0.5, 6]} />
        </mesh>
      ))}
    </>
  );
}

function House({ b, seed }: { b: Box; seed: number }) {
  const r = rng(seed);
  const d = FRONT - BACK - 0.5;
  const zc = (FRONT + BACK) / 2 - 0.25;
  const body = r() > 0.5 ? PALETTE.mud : PALETTE.mudLight;
  return (
    <group>
      <mesh material={toon(body)} position={[b.x + b.w / 2, b.y + b.h / 2, zc]} castShadow receiveShadow>
        <boxGeometry args={[b.w, b.h, d]} />
      </mesh>
      {/* parapet lip and pinnacles */}
      <mesh material={toon(PALETTE.mudDark)} position={[b.x + b.w / 2, b.y + b.h + 0.05, zc]} receiveShadow>
        <boxGeometry args={[b.w + 0.12, 0.1, d + 0.12]} />
      </mesh>
      <Pinnacles x={b.x} y={b.y + b.h} w={b.w} d={d} z={zc} color={PALETTE.mudDark} />
      {/* doorway and a band of carved relief on the facade */}
      {b.h > 1.6 && (
        <mesh material={toon(PALETTE.ink)} position={[b.x + b.w * 0.35, b.y + 0.7, zc + d / 2 + 0.01]}>
          <planeGeometry args={[0.7, 1.4]} />
        </mesh>
      )}
      <mesh material={toon(PALETTE.mudDark)} position={[b.x + b.w / 2, b.y + b.h - 0.35, zc + d / 2 + 0.02]}>
        <boxGeometry args={[b.w * 0.8, 0.08, 0.04]} />
      </mesh>
      {Array.from({ length: Math.max(1, Math.floor(b.w / 1.3)) }, (_, i) => (
        <mesh key={i} material={toon(PALETTE.mudDark)} position={[b.x + 0.6 + i * 1.3, b.y + b.h - 0.6, zc + d / 2 + 0.02]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.22, 0.22, 0.04]} />
        </mesh>
      ))}
    </group>
  );
}

function CityWall({ b }: { b: Box }) {
  const d = 5;
  const zc = -0.6;
  return (
    <group>
      <mesh material={toon(PALETTE.laterite)} position={[b.x + b.w / 2, b.y + b.h / 2, zc]} castShadow receiveShadow>
        <boxGeometry args={[b.w, b.h, d]} />
      </mesh>
      <Pinnacles x={b.x} y={b.y + b.h} w={b.w} d={d} z={zc} color={PALETTE.laterite} every={0.6} />
      {/* the wall runs off into the distance behind the street */}
      <mesh material={toon(PALETTE.mudDark)} position={[b.x + b.w / 2, b.y + b.h / 2 - 0.5, zc - 9]}>
        <boxGeometry args={[b.w * 0.9, b.h - 1, 13]} />
      </mesh>
      {[0.3, 1.2, 2.1].map((dy) => (
        <mesh key={dy} material={toon(PALETTE.mudDark)} position={[b.x + b.w / 2, b.y + 1 + dy * 1.6, zc + d / 2 + 0.02]}>
          <boxGeometry args={[b.w * 0.85, 0.08, 0.04]} />
        </mesh>
      ))}
    </group>
  );
}

function Baskets({ b }: { b: Box }) {
  // a trader's stack: woven grain baskets with dark bands
  const rows = Math.round(b.h / 1.2);
  return (
    <group>
      {Array.from({ length: rows }, (_, i) => (
        <group key={i} position={[b.x + b.w / 2, b.y + 0.6 + i * 1.2, 0]}>
          <mesh material={toon(PALETTE.straw)} castShadow receiveShadow>
            <cylinderGeometry args={[b.w / 2, b.w / 2 - 0.08, 1.2, 12]} />
          </mesh>
          {[-0.3, 0.3].map((y) => (
            <mesh key={y} material={toon(PALETTE.wood)} position={[0, y, 0]}>
              <cylinderGeometry args={[b.w / 2 + 0.01, b.w / 2 + 0.01, 0.08, 12]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Well({ b, goal }: { b: Box; goal: Level['goal'] }) {
  const glow = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.elapsedTime * 2.5) * 0.08;
    glow.current.scale.set(s, 1, s);
  });
  const cx = b.x + b.w / 2;
  return (
    <group>
      <mesh material={toon(PALETTE.mudLight)} position={[cx, b.h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[b.w / 2, b.w / 2 + 0.1, b.h, 20]} />
      </mesh>
      <mesh material={toon(PALETTE.water)} position={[cx, b.h + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[b.w / 2 - 0.25, 20]} />
      </mesh>
      {/* the frame, crossbar, rope and bucket */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={toon(PALETTE.wood)} position={[cx + s * (b.w / 2 - 0.1), b.h + 1.1, 0]} castShadow>
          <boxGeometry args={[0.16, 2.2, 0.16]} />
        </mesh>
      ))}
      <mesh material={toon(PALETTE.wood)} position={[cx, b.h + 2.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, b.w, 8]} />
      </mesh>
      <mesh material={toon(PALETTE.straw)} position={[cx + 0.5, b.h + 1.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 4]} />
      </mesh>
      <mesh material={toon(PALETTE.wood)} position={[cx + 0.5, b.h + 0.8, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.3, 10]} />
      </mesh>
      {/* the goal marker: a soft gold ring on the well's lip */}
      <mesh ref={glow} position={[goal.x, goal.y + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.75, 32]} />
        <meshBasicMaterial color={PALETTE.gold} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function Rope({ c }: { c: Climb }) {
  if (c.kind === 'rope') {
    return (
      <group>
        <mesh material={toon(PALETTE.straw)} position={[c.x, c.y + c.h / 2, 0.15]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, c.h, 6]} />
        </mesh>
        {Array.from({ length: Math.floor(c.h / 0.8) }, (_, i) => (
          <mesh key={i} material={toon(PALETTE.wood)} position={[c.x, c.y + 0.5 + i * 0.8, 0.15]}>
            <sphereGeometry args={[0.08, 6, 5]} />
          </mesh>
        ))}
        <mesh material={toon(PALETTE.wood)} position={[c.x + 0.3, c.y + c.h - 0.05, 0.15]}>
          <boxGeometry args={[0.8, 0.12, 0.12]} />
        </mesh>
      </group>
    );
  }
  return (
    <group position={[c.x, c.y, 0.9]}>
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} material={toon(PALETTE.wood)} position={[x, c.h / 2, 0]} castShadow>
          <boxGeometry args={[0.07, c.h + 0.3, 0.07]} />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(c.h / 0.35) }, (_, i) => (
        <mesh key={i} material={toon(PALETTE.wood)} position={[0, 0.3 + i * 0.35, 0]}>
          <boxGeometry args={[0.5, 0.05, 0.05]} />
        </mesh>
      ))}
    </group>
  );
}

function Palm({ x, z, h, seed }: { x: number; z: number; h: number; seed: number }) {
  const r = rng(seed);
  const lean = (r() - 0.5) * 0.3;
  return (
    <group position={[x, 0, z]} rotation={[0, 0, lean]}>
      <mesh material={toon(PALETTE.wood)} position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.2, h, 7]} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2 + r();
        return (
          <mesh key={i} material={toon(i % 2 ? PALETTE.palm : PALETTE.palmDark)} position={[Math.cos(a) * 0.8, h - 0.1, Math.sin(a) * 0.8]} rotation={[Math.sin(a) * 0.6, -a, -0.5 * Math.cos(a)]}>
            <boxGeometry args={[1.8, 0.05, 0.4]} />
          </mesh>
        );
      })}
    </group>
  );
}

/** The town behind the path: rows of houses, palms and a far wall, with no collision. */
function Skyline({ minX, maxX }: { minX: number; maxX: number }) {
  const items = useMemo(() => {
    const r = rng(7);
    const houses: { x: number; z: number; w: number; h: number; d: number; c: string }[] = [];
    const palms: { x: number; z: number; h: number; seed: number }[] = [];
    for (const [z, scale] of [
      [-6, 1],
      [-11, 1.3],
      [-18, 1.6],
    ] as const) {
      for (let x = minX - 10; x < maxX + 10; ) {
        const w = (2.5 + r() * 3) * scale;
        houses.push({ x: x + w / 2, z: z - r() * 1.5, w, h: (1.6 + r() * 2.4) * scale, d: 2.5 * scale, c: r() > 0.5 ? PALETTE.mud : PALETTE.mudLight });
        if (r() > 0.6) palms.push({ x: x + w + 0.6, z: z + 1.4, h: 3.5 + r() * 2.5, seed: Math.floor(r() * 1000) });
        x += w + 0.3 + r() * 1.5;
      }
    }
    return { houses, palms };
  }, [minX, maxX]);
  return (
    <group>
      {items.houses.map((h, i) => (
        <group key={i}>
          <mesh material={toon(h.c)} position={[h.x, h.h / 2, h.z]} receiveShadow>
            <boxGeometry args={[h.w, h.h, h.d]} />
          </mesh>
          <Pinnacles x={h.x - h.w / 2} y={h.h} w={h.w} d={h.d} z={h.z} color={PALETTE.mudDark} />
        </group>
      ))}
      {items.palms.map((p, i) => (
        <Palm key={i} {...p} />
      ))}
      {/* the ground behind and in front of the street */}
      <mesh material={toon(PALETTE.sand)} position={[(minX + maxX) / 2, -0.02, -14]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[maxX - minX + 80, 24]} />
      </mesh>
      {/* far hills */}
      {[-10, 20, 50, 80, 110].map((x, i) => (
        <mesh key={x} material={toon(i % 2 ? '#c99868' : '#d6aa79')} position={[x, -4, -60]} scale={[1.6, 0.6, 1]}>
          <sphereGeometry args={[18, 16, 10]} />
        </mesh>
      ))}
    </group>
  );
}

export function Daura({ level }: { level: Level }) {
  return (
    <group>
      {level.boxes.map((b, i) => {
        switch (b.kind) {
          case 'ground':
            return (
              <group key={i}>
                <mesh material={toon(PALETTE.laterite)} position={[b.x + b.w / 2, b.y + b.h / 2, (FRONT + BACK) / 2 + 0.5]} receiveShadow>
                  <boxGeometry args={[b.w, b.h, FRONT - BACK + 1]} />
                </mesh>
                <mesh material={toon(PALETTE.sand)} position={[b.x + b.w / 2, b.y + b.h + 0.005, (FRONT + BACK) / 2 + 0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                  <planeGeometry args={[b.w, FRONT - BACK + 1]} />
                </mesh>
              </group>
            );
          case 'house':
            return <House key={i} b={b} seed={i + 3} />;
          case 'wall':
            return <CityWall key={i} b={b} />;
          case 'crate':
            return <Baskets key={i} b={b} />;
          case 'well':
            return <Well key={i} b={b} goal={level.goal} />;
        }
      })}
      {level.climbs.map((c, i) => (
        <Rope key={i} c={c} />
      ))}
      {/* the dry gully floor */}
      <mesh material={toon(PALETTE.mudDark)} position={[29.5, -6, 0]}>
        <boxGeometry args={[3, 1, 6]} />
      </mesh>
      <Palm x={5} z={-2.6} h={4.5} seed={11} />
      <Palm x={34} z={-2.8} h={5.2} seed={12} />
      <Palm x={72} z={-2.6} h={4.8} seed={13} />
      <Palm x={89} z={-2.7} h={5.5} seed={14} />
      <Skyline minX={level.bounds.minX} maxX={level.bounds.maxX} />
    </group>
  );
}

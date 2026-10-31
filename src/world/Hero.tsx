import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Hero as HeroState } from '../game/physics';
import { PALETTE, toon } from './toon';

// The griot's apprentice, built from simple shapes and animated in code (no model or animation files): a walk and
// run cycle, a jump pose, hand-over-hand climbing and idle breathing, all from the hero's movement state.

const lerp = THREE.MathUtils.lerp;

/** Ease a value toward a target at `rate` per second, frame-rate independent. */
const damp = (from: number, to: number, rate: number, dt: number) => lerp(from, to, 1 - Math.exp(-rate * dt));

/** The kalangu (talking drum): an hourglass turned on a lathe. */
function drumGeometry() {
  const pts = [
    [0.0, -0.17],
    [0.1, -0.17],
    [0.1, -0.15],
    [0.06, -0.05],
    [0.045, 0],
    [0.06, 0.05],
    [0.1, 0.15],
    [0.1, 0.17],
    [0.0, 0.17],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 14);
}

/** `drumming` is above 0 while the hero is playing the drum (seconds left of the pose). */
export function Hero({ state, drumming }: { state: RefObject<HeroState>; drumming?: RefObject<number> }) {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const robe = useRef<THREE.Mesh>(null!);
  const anim = useRef({ phase: 0, turn: -Math.PI / 2, t: 0 });
  const drum = useMemo(drumGeometry, []);

  useFrame((_, rawDt) => {
    const h = state.current;
    if (!h) return;
    const dt = Math.min(rawDt, 0.05);
    const a = anim.current;
    a.t += dt;
    const t = a.t;

    root.current.position.set(h.x, h.y, 0);
    // Face along the path, turned a little toward the camera so we see the face. Climbing faces the wall.
    const turnTo = h.mode === 'climb' ? 0 : -h.facing * (Math.PI / 2 + 0.45);
    a.turn = damp(a.turn, turnTo, 14, dt);
    root.current.rotation.y = a.turn;

    const speed = Math.abs(h.vx);
    const moving = h.mode === 'walk' || h.mode === 'run';
    a.phase += dt * (moving ? 2.2 + speed * 1.45 : h.mode === 'climb' ? Math.abs(h.vy) * 3 : 0);

    let legSwing = 0;
    let armSwing = 0;
    let bob = 0;
    let lean = 0;
    let lL = 0;
    let lR = 0;
    let aL = 0;
    let aR = 0;
    let armOut = 0.08;

    if (moving) {
      const stride = h.mode === 'run' ? 0.85 : 0.55;
      legSwing = Math.sin(a.phase) * stride;
      armSwing = Math.sin(a.phase) * stride * 0.9;
      bob = Math.abs(Math.cos(a.phase)) * (h.mode === 'run' ? 0.09 : 0.05);
      lean = h.mode === 'run' ? 0.22 : 0.06;
      lL = legSwing;
      lR = -legSwing;
      aL = -armSwing;
      aR = armSwing;
    } else if (h.mode === 'jump' || h.mode === 'fall') {
      // tuck on the way up, reach down on the way down
      const up = h.vy > 0;
      lL = up ? 0.9 : 0.25;
      lR = up ? -0.4 : -0.35;
      aL = up ? 2.5 : 1.2;
      aR = up ? -0.6 : 1.0;
      armOut = 0.4;
      lean = up ? 0.1 : -0.05;
    } else if (h.mode === 'climb') {
      // hand over hand, knees lifting in turn
      const s = Math.sin(a.phase);
      aL = 2.6 + s * 0.45;
      aR = 2.6 - s * 0.45;
      lL = 0.5 + Math.max(0, s) * 0.7;
      lR = 0.5 + Math.max(0, -s) * 0.7;
      armOut = 0.15;
    } else {
      // idle: breathing and a slow sway, now and then a tap on the drum
      bob = Math.sin(t * 1.8) * 0.012;
      aL = Math.sin(t * 1.1) * 0.04;
      aR = 0.5 + (Math.sin(t * 0.9) > 0.85 ? Math.abs(Math.sin(t * 14)) * 0.25 : 0);
      lean = Math.sin(t * 0.6) * 0.02;
    }

    // Playing the drum: the left arm squeezes it under the arm, the right hand beats it fast.
    if (drumming?.current && h.mode !== 'climb') {
      aL = 0.35;
      aR = 0.9 + Math.abs(Math.sin(t * 22)) * 0.5;
      armOut = 0.25;
    }

    const k = 18;
    legL.current.rotation.x = damp(legL.current.rotation.x, lL, k, dt);
    legR.current.rotation.x = damp(legR.current.rotation.x, lR, k, dt);
    armL.current.rotation.x = damp(armL.current.rotation.x, aL, k, dt);
    armR.current.rotation.x = damp(armR.current.rotation.x, aR, k, dt);
    armL.current.rotation.z = damp(armL.current.rotation.z, armOut, k, dt);
    armR.current.rotation.z = damp(armR.current.rotation.z, -armOut, k, dt);
    body.current.position.y = damp(body.current.position.y, bob, 20, dt);
    body.current.rotation.x = damp(body.current.rotation.x, lean, 10, dt);
    head.current.rotation.x = damp(head.current.rotation.x, -lean * 0.6, 10, dt);
    // the robe flares as the legs swing
    const flare = 1 + Math.abs(legSwing) * 0.12 + (h.mode === 'jump' || h.mode === 'fall' ? 0.08 : 0);
    robe.current.scale.x = damp(robe.current.scale.x, flare, 12, dt);
    robe.current.scale.z = damp(robe.current.scale.z, flare, 12, dt);
  });

  const skin = toon(PALETTE.skin);
  const cloth = toon(PALETTE.indigo);
  const trim = toon(PALETTE.white);
  const trousers = toon(PALETTE.white);
  const ink = toon(PALETTE.ink);

  return (
    <group ref={root}>
      <group ref={body}>
        {/* legs, pivoting at the hip */}
        {[
          [legL, -0.1],
          [legR, 0.1],
        ].map(([ref, x], i) => (
          <group key={i} ref={ref as RefObject<THREE.Group>} position={[x as number, 0.72, 0]}>
            <mesh material={trousers} position={[0, -0.33, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.5, 4, 8]} />
            </mesh>
            <mesh material={toon(PALETTE.wood)} position={[0, -0.69, -0.05]} castShadow>
              <boxGeometry args={[0.13, 0.06, 0.24]} />
            </mesh>
          </group>
        ))}

        {/* the riga robe: a flared cone with a white hem */}
        <mesh ref={robe} material={cloth} position={[0, 0.88, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.36, 0.78, 16]} />
        </mesh>
        <mesh material={trim} position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.365, 0.37, 0.05, 16]} />
        </mesh>
        <mesh material={trim} position={[0, 1.08, -0.16]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[0.1, 0.32, 0.02]} />
        </mesh>
        <mesh material={cloth} position={[0, 1.27, 0]}>
          <sphereGeometry args={[0.2, 14, 10]} />
        </mesh>

        {/* the drum on its strap, at the left hip */}
        <mesh geometry={drum} material={toon(PALETTE.wood)} position={[-0.32, 0.9, 0.02]} rotation={[0, 0, 0.25]} castShadow />
        <mesh material={toon(PALETTE.straw)} position={[-0.32, 0.9, 0.02]} rotation={[0, 0, 0.25]}>
          <cylinderGeometry args={[0.104, 0.104, 0.3, 14, 1, true]} />
        </mesh>
        {[-0.19, 0.19].map((z) => (
          <mesh key={z} material={toon(PALETTE.laterite)} position={[-0.06, 1.1, z]} rotation={[0, 0, -0.85]}>
            <boxGeometry args={[0.05, 0.62, 0.02]} />
          </mesh>
        ))}

        {/* arms, pivoting at the shoulder, wide sleeves */}
        {[
          [armL, -0.26],
          [armR, 0.26],
        ].map(([ref, x], i) => (
          <group key={i} ref={ref as RefObject<THREE.Group>} position={[x as number, 1.3, 0]}>
            <mesh material={cloth} position={[0, -0.16, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.11, 0.34, 10]} />
            </mesh>
            <mesh material={skin} position={[0, -0.4, 0]}>
              <capsuleGeometry args={[0.045, 0.14, 4, 8]} />
            </mesh>
            <mesh material={skin} position={[0, -0.52, 0]}>
              <sphereGeometry args={[0.055, 10, 8]} />
            </mesh>
          </group>
        ))}

        {/* head, cap and face; the face looks toward -Z */}
        <group ref={head} position={[0, 1.55, 0]}>
          <mesh material={skin} castShadow>
            <sphereGeometry args={[0.19, 18, 14]} />
          </mesh>
          <mesh material={skin} position={[0, -0.13, 0]}>
            <cylinderGeometry args={[0.06, 0.07, 0.1, 10]} />
          </mesh>
          {/* the hula cap, white with an indigo band */}
          <mesh material={trim} position={[0, 0.12, 0.01]}>
            <cylinderGeometry args={[0.165, 0.185, 0.14, 18]} />
          </mesh>
          <mesh material={toon(PALETTE.indigoLight)} position={[0, 0.07, 0.01]}>
            <cylinderGeometry args={[0.188, 0.188, 0.035, 18]} />
          </mesh>
          {[-0.065, 0.065].map((x) => (
            <mesh key={x} material={ink} position={[x, 0.01, -0.17]}>
              <sphereGeometry args={[0.025, 8, 6]} />
            </mesh>
          ))}
          <mesh material={ink} position={[0, -0.07, -0.175]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.008, 0.05, 2, 4]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

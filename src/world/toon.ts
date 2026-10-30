import * as THREE from 'three';

// The cartoon look: flat toon shading in three bands, shared materials so a whole street costs a handful of them.

const gradient = (() => {
  const t = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const cache = new Map<string, THREE.MeshToonMaterial>();

/** A toon material in this colour, made once and shared. */
export function toon(color: string) {
  let m = cache.get(color);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: gradient });
    cache.set(color, m);
  }
  return m;
}

/** The palette of the Daura chapter: dusty laterite, mud brick, indigo cloth, harmattan gold. */
export const PALETTE = {
  ink: '#2a1d17',
  sand: '#d8a46a',
  laterite: '#b8693d',
  mud: '#c58552',
  mudDark: '#9c5f37',
  mudLight: '#dca473',
  wood: '#6e4527',
  straw: '#d9b26a',
  indigo: '#2c3f7a',
  indigoLight: '#4f6bb0',
  white: '#f2ead8',
  skin: '#6b4026',
  palm: '#5d7a35',
  palmDark: '#3f5a24',
  sky: '#f0c27d',
  water: '#3f7f8f',
  gold: '#f4c542',
};

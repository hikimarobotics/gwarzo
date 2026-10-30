import type { WorldInput } from './world';

// One input state shared by the keyboard and the on-screen touch buttons. The game reads it every frame.

export const input: WorldInput = { move: 0, up: false, down: false, jump: false, run: false, rewind: false, hold: false, hasten: false };

const held = new Set<string>();
/** Keys pressed since the last read, so a tap shorter than a frame still counts. */
const tapped = new Set<string>();
/** Touch buttons currently pressed, by name. */
export const touch = new Set<'left' | 'right' | 'up' | 'down' | 'jump' | 'run' | 'rewind' | 'hold' | 'hasten'>();

const LEFT = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const UP = ['ArrowUp', 'KeyW'];
const DOWN = ['ArrowDown', 'KeyS'];
const JUMP = ['Space', 'KeyK'];
const RUN = ['ShiftLeft', 'ShiftRight'];
// the drum
const REWIND = ['KeyQ'];
const HOLD = ['KeyE'];
const HASTEN = ['KeyR'];
const GAME_KEYS = new Set([...LEFT, ...RIGHT, ...UP, ...DOWN, ...JUMP, ...RUN, ...REWIND, ...HOLD, ...HASTEN]);

const any = (codes: string[]) => codes.some((c) => held.has(c) || tapped.has(c));

/** Folds keyboard and touch into `input`. Called once per frame. */
export function readInput() {
  const left = any(LEFT) || touch.has('left');
  const right = any(RIGHT) || touch.has('right');
  input.move = (right ? 1 : 0) - (left ? 1 : 0);
  input.up = any(UP) || touch.has('up');
  input.down = any(DOWN) || touch.has('down');
  input.jump = any(JUMP) || touch.has('jump');
  input.run = any(RUN) || touch.has('run');
  input.rewind = any(REWIND) || touch.has('rewind');
  input.hold = any(HOLD) || touch.has('hold');
  input.hasten = any(HASTEN) || touch.has('hasten');
  tapped.clear();
}

export function listenToKeyboard() {
  const down = (e: KeyboardEvent) => {
    if (!GAME_KEYS.has(e.code)) return;
    e.preventDefault();
    held.add(e.code);
    tapped.add(e.code);
  };
  const up = (e: KeyboardEvent) => held.delete(e.code);
  const clear = () => held.clear();
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', clear);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', clear);
  };
}

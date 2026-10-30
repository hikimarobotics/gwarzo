import type { Input } from './physics';

// One input state shared by the keyboard and the on-screen touch buttons. The game reads it every frame.

export const input: Input = { move: 0, up: false, down: false, jump: false, run: false };

const held = new Set<string>();
/** Touch buttons currently pressed, by name. */
export const touch = new Set<'left' | 'right' | 'up' | 'down' | 'jump' | 'run'>();

const LEFT = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const UP = ['ArrowUp', 'KeyW'];
const DOWN = ['ArrowDown', 'KeyS'];
const JUMP = ['Space', 'KeyK'];
const RUN = ['ShiftLeft', 'ShiftRight'];
const GAME_KEYS = new Set([...LEFT, ...RIGHT, ...UP, ...DOWN, ...JUMP, ...RUN]);

const any = (codes: string[]) => codes.some((c) => held.has(c));

/** Folds keyboard and touch into `input`. Called once per frame. */
export function readInput() {
  const left = any(LEFT) || touch.has('left');
  const right = any(RIGHT) || touch.has('right');
  input.move = (right ? 1 : 0) - (left ? 1 : 0);
  input.up = any(UP) || touch.has('up');
  input.down = any(DOWN) || touch.has('down');
  input.jump = any(JUMP) || touch.has('jump');
  input.run = any(RUN) || touch.has('run');
}

export function listenToKeyboard() {
  const down = (e: KeyboardEvent) => {
    if (!GAME_KEYS.has(e.code)) return;
    e.preventDefault();
    held.add(e.code);
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

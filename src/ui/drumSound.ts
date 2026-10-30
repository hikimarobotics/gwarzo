import type { Verb } from '../game/time';

// The talking drum, synthesised: a short pitched thump whose pitch bends the way time is going (down to rewind, up
// to hasten, steady to hold). No sound files. The audio starts on the first key or tap, as browsers require.

let ctx: AudioContext | null = null;

function audio() {
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Unlocks audio on the first user gesture. */
export function unlockAudioOnGesture() {
  const unlock = () => {
    audio();
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('keydown', unlock);
  window.addEventListener('pointerdown', unlock);
}

const BEND: Record<Verb, [number, number]> = {
  rewind: [230, 110],
  hold: [150, 150],
  hasten: [120, 260],
};

/** One drum beat for this verb. `accent` makes it louder (the first beat of a phrase). */
export function beat(verb: Verb, accent = false) {
  const a = audio();
  if (!a || a.state !== 'running') return;
  const now = a.currentTime;
  const [from, to] = BEND[verb];
  const len = verb === 'hold' ? 0.35 : 0.2;

  const osc = a.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(to, now + len);

  const gain = a.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + len);

  // a slap of noise for the stick hitting the skin
  const noise = a.createBufferSource();
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * 0.03), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  noise.buffer = buf;
  const slap = a.createGain();
  slap.gain.value = accent ? 0.15 : 0.08;

  osc.connect(gain).connect(a.destination);
  noise.connect(slap).connect(a.destination);
  osc.start(now);
  osc.stop(now + len + 0.02);
  noise.start(now);
}

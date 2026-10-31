import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { DAURA } from './game/level';
import { Game, type DrumView } from './world/Game';
import { TouchControls } from './ui/TouchControls';

const NAMES: Record<string, string> = { bridge: 'the old bridge', hoist: 'the hoist' };

export function App() {
  const [done, setDone] = useState(false);
  const [drum, setDrum] = useState<DrumView>({ target: null, holding: null, playing: null });
  return (
    <div className={`app ${drum.playing ? `time-${drum.playing}` : ''}`}>
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 40, near: 0.1, far: 300, position: [2, 4, 13] }}>
        <Game level={DAURA} onGoal={() => setDone(true)} onDrum={setDrum} />
      </Canvas>
      <div className="time-tint" aria-hidden />

      <header className="hud">
        <h1>Gwarzo</h1>
        <p>Chapter 1 · {DAURA.name}</p>
      </header>

      <div className="drum-status" aria-live="polite">
        {drum.target && <span>🥁 {NAMES[drum.target] ?? drum.target} is in reach</span>}
        {drum.holding && <span className="held">Holding {NAMES[drum.holding] ?? drum.holding} still</span>}
      </div>

      <p className="hint">
        <span className="desktop-only">← → walk · Shift run · Space jump · ↑ climb · Drum: Q rewind · E hold · R hasten</span>
        <span className="touch-only">Reach the well. Beat the drum to bend time.</span>
      </p>

      {done && (
        <div className="banner" role="status">
          <h2>You reached the well</h2>
          <p>Something stirs in the water below. The story continues soon.</p>
        </div>
      )}

      <TouchControls />
    </div>
  );
}

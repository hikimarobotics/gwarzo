import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { DAURA } from './game/level';
import { Game } from './world/Game';
import { TouchControls } from './ui/TouchControls';

export function App() {
  const [done, setDone] = useState(false);
  return (
    <div className="app">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 40, near: 0.1, far: 300, position: [2, 4, 13] }}>
        <Game level={DAURA} onGoal={() => setDone(true)} />
      </Canvas>

      <header className="hud">
        <h1>Gwarzo</h1>
        <p>Chapter 1 · {DAURA.name}</p>
      </header>

      <p className="hint">
        <span className="desktop-only">← → or A D to walk · Shift to run · Space to jump · ↑ to climb</span>
        <span className="touch-only">Reach the well at the end of the street</span>
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

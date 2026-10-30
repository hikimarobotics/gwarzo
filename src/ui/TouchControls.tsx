import type { PointerEvent } from 'react';
import { touch } from '../game/input';

// On-screen buttons for phones: a d-pad on the left; the drum (rewind, hold, hasten), run and jump on the right.
// Each holds while a finger is down.

type Name = Parameters<typeof touch.add>[0];

function Pad({ name, label, className }: { name: Name; label: string; className: string }) {
  const press = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    touch.add(name);
  };
  const release = () => touch.delete(name);
  return (
    <button
      className={`pad ${className}`}
      aria-label={name}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}

export function TouchControls() {
  return (
    <div className="touch-controls touch-only">
      <div className="dpad">
        <Pad name="up" label="▲" className="up" />
        <Pad name="left" label="◀" className="left" />
        <Pad name="right" label="▶" className="right" />
        <Pad name="down" label="▼" className="down" />
      </div>
      <div className="actions">
        <div className="drum-pads">
          <Pad name="rewind" label="⟲" className="drum rewind" />
          <Pad name="hold" label="⏸" className="drum hold" />
          <Pad name="hasten" label="⏩" className="drum hasten" />
        </div>
        <div className="move-pads">
          <Pad name="run" label="Run" className="run" />
          <Pad name="jump" label="Jump" className="jump" />
        </div>
      </div>
    </div>
  );
}

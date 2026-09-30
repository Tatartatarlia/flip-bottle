import { useEffect, useRef } from "react";
import { FlipEngine } from "../game/engine";
import "./Game.css";

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new FlipEngine(canvas, { onChange: () => {} });
    return () => engine.destroy();
  }, []);

  return (
    <div className="wrap">
      <div className="stage">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

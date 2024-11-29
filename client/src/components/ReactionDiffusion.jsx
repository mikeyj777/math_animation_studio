// src/components/ReactionDiffusion.jsx
import React, { useEffect, useRef, useState } from 'react';

const ReactionDiffusion = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(true);
  const [feed, setFeed] = useState(0.055);
  const [kill, setKill] = useState(0.062);
  const [diffusionA, setDiffusionA] = useState(1.0);
  const [diffusionB, setDiffusionB] = useState(0.5);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    let imageData = ctx.getImageData(0, 0, width, height);
    let pixels = imageData.data;

    // Initialize concentrations
    let a = new Array(width * height).fill(1);
    let b = new Array(width * height).fill(0);

    // Seed initial pattern in the center
    const seed = () => {
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      for (let y = -10; y <= 10; y++) {
        for (let x = -10; x <= 10; x++) {
          const index = (centerX + x) + (centerY + y) * width;
          b[index] = 1;
        }
      }
    };

    seed();

    let animationFrameId;

    const render = () => {
      if (!isRunning) {
        return;
      }

      // Reaction-diffusion equations
      let aNext = a.slice();
      let bNext = b.slice();

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const index = x + y * width;

          // Laplacian of A and B
          const laplaceA =
            a[index - 1] +
            a[index + 1] +
            a[index - width] +
            a[index + width] -
            4 * a[index];

          const laplaceB =
            b[index - 1] +
            b[index + 1] +
            b[index - width] +
            b[index + width] -
            4 * b[index];

          const reaction = a[index] * b[index] * b[index];

          aNext[index] =
            a[index] +
            (diffusionA * laplaceA - reaction + feed * (1 - a[index])) * 1.0;

          bNext[index] =
            b[index] +
            (diffusionB * laplaceB + reaction - (kill + feed) * b[index]) * 1.0;

          // Clamp values between 0 and 1
          aNext[index] = Math.min(Math.max(aNext[index], 0), 1);
          bNext[index] = Math.min(Math.max(bNext[index], 0), 1);

          // Update pixel color
          const c = Math.floor((aNext[index] - bNext[index]) * 255);
          const idx = index * 4;
          pixels[idx] = c;
          pixels[idx + 1] = c;
          pixels[idx + 2] = c;
          pixels[idx + 3] = 255;
        }
      }

      // Swap arrays
      [a, aNext] = [aNext, a];
      [b, bNext] = [bNext, b];

      ctx.putImageData(imageData, 0, 0);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, feed, kill, diffusionA, diffusionB]);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeout(() => {
      setIsRunning(true);
    }, 100);
  };

  return (
    <div className="rd-container">
      <h2>Reaction-Diffusion Simulation</h2>
      <canvas ref={canvasRef} width={300} height={300} className="rd-canvas" />
      <div className="rd-controls">
        <button onClick={handleStartStop} className="rd-button">
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button onClick={handleReset} className="rd-button">
          Reset
        </button>
        <div className="rd-slider-group">
          <label>
            Feed Rate: {feed.toFixed(3)}
            <input
              type="range"
              min="0.01"
              max="0.09"
              step="0.001"
              value={feed}
              onChange={(e) => setFeed(parseFloat(e.target.value))}
            />
          </label>
        </div>
        <div className="rd-slider-group">
          <label>
            Kill Rate: {kill.toFixed(3)}
            <input
              type="range"
              min="0.03"
              max="0.07"
              step="0.001"
              value={kill}
              onChange={(e) => setKill(parseFloat(e.target.value))}
            />
          </label>
        </div>
        <div className="rd-slider-group">
          <label>
            Diffusion A: {diffusionA.toFixed(2)}
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={diffusionA}
              onChange={(e) => setDiffusionA(parseFloat(e.target.value))}
            />
          </label>
        </div>
        <div className="rd-slider-group">
          <label>
            Diffusion B: {diffusionB.toFixed(2)}
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={diffusionB}
              onChange={(e) => setDiffusionB(parseFloat(e.target.value))}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default ReactionDiffusion;

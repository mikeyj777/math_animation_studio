// src/components/ReactionDiffusion.jsx
import React, { useEffect, useRef, useState } from 'react';

const presets = {
  'Turing Pattern': { feed: 0.035, kill: 0.065 },
  'Coral': { feed: 0.0545, kill: 0.062 },
  'Fingerprint': { feed: 0.037, kill: 0.06 },
  'Spirals': { feed: 0.01, kill: 0.047 },
  'Spots': { feed: 0.078, kill: 0.061 },
  'Worms': { feed: 0.1, kill: 0.05 },
  'U-Skate World': { feed: 0.062, kill: 0.061 },
  'Chaos': { feed: 0.026, kill: 0.051 },
};

const colorSchemes = {
  Grayscale: { r: [0, 255], g: [0, 255], b: [0, 255] },
  Fire: { r: [0, 255], g: [0, 128], b: [0, 0] },
  Ocean: { r: [0, 0], g: [0, 128], b: [128, 255] },
  Forest: { r: [0, 34], g: [32, 139], b: [0, 34] },
  Sunset: { r: [255, 255], g: [94, 0], b: [0, 0] },
  Psychedelic: { r: [0, 255], g: [255, 0], b: [0, 255] },
  Rainbow: { r: [148, 255], g: [0, 255], b: [211, 0] },
};

const ReactionDiffusion = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(true);

  const [feed, setFeed] = useState(0.055);
  const [kill, setKill] = useState(0.062);
  const [diffusionA, setDiffusionA] = useState(1.0);
  const [diffusionB, setDiffusionB] = useState(0.5);

  const [selectedPreset, setSelectedPreset] = useState('Turing Pattern');
  const [selectedColorScheme, setSelectedColorScheme] = useState('Grayscale');

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

    // Seed initial pattern
    const seed = () => {
      for (let i = 0; i < 10; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        const index = x + y * width;
        b[index] = 1;
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
            a[index + width] +
            0.05 * (a[index - width - 1] +
              a[index - width + 1] +
              a[index + width - 1] +
              a[index + width + 1]) -
            4.2 * a[index];

          const laplaceB =
            b[index - 1] +
            b[index + 1] +
            b[index - width] +
            b[index + width] +
            0.05 * (b[index - width - 1] +
              b[index - width + 1] +
              b[index + width - 1] +
              b[index + width + 1]) -
            4.2 * b[index];

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

          const color = getColor(c);
          pixels[idx] = color.r;
          pixels[idx + 1] = color.g;
          pixels[idx + 2] = color.b;
          pixels[idx + 3] = 255;
        }
      }

      // Swap arrays
      a = aNext;
      b = bNext;

      ctx.putImageData(imageData, 0, 0);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, feed, kill, diffusionA, diffusionB, selectedColorScheme]);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeout(() => {
      setIsRunning(true);
    }, 100);
  };

  const handlePresetChange = (e) => {
    const presetName = e.target.value;
    setSelectedPreset(presetName);
    const preset = presets[presetName];
    setFeed(preset.feed);
    setKill(preset.kill);
    handleReset();
  };

  const handleColorSchemeChange = (e) => {
    setSelectedColorScheme(e.target.value);
  };

  const getColor = (value) => {
    const scheme = colorSchemes[selectedColorScheme];
    const r = mapRange(value, 0, 255, scheme.r[0], scheme.r[1]);
    const g = mapRange(value, 0, 255, scheme.g[0], scheme.g[1]);
    const b = mapRange(value, 0, 255, scheme.b[0], scheme.b[1]);
    return { r, g, b };
  };

  const mapRange = (value, inMin, inMax, outMin, outMax) => {
    return Math.floor(((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin);
  };

  return (
    <div className="rd-container">
      <h2>Reaction-Diffusion Simulation</h2>
      <canvas ref={canvasRef} width={400} height={400} className="rd-canvas" />
      <div className="rd-controls">
        <div className="rd-buttons">
          <button onClick={handleStartStop} className="rd-button">
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button onClick={handleReset} className="rd-button">
            Reset
          </button>
        </div>
        <div className="rd-select-group">
          <label>
            Preset Pattern:
            <select value={selectedPreset} onChange={handlePresetChange}>
              {Object.keys(presets).map((presetName) => (
                <option key={presetName} value={presetName}>
                  {presetName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="rd-select-group">
          <label>
            Color Scheme:
            <select value={selectedColorScheme} onChange={handleColorSchemeChange}>
              {Object.keys(colorSchemes).map((schemeName) => (
                <option key={schemeName} value={schemeName}>
                  {schemeName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="rd-slider-group">
          <label>
            Feed Rate: {feed.toFixed(3)}
            <input
              type="range"
              min="0.0"
              max="0.1"
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
              min="0.0"
              max="0.1"
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
              max="2.0"
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

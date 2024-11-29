// src/components/ReactionDiffusion.jsx
import React, { useEffect, useRef, useState } from 'react';

const presets = {
  'Coral Growth': { feed: 0.0545, kill: 0.062, diffA: 1.0, diffB: 0.5, brushSize: 15, flowField: true },
  'Neural Network': { feed: 0.037, kill: 0.06, diffA: 0.8, diffB: 0.4, brushSize: 5, flowField: false },
  'Maze Runner': { feed: 0.029, kill: 0.057, diffA: 0.9, diffB: 0.5, brushSize: 3, flowField: true },
  'Cellular Chaos': { feed: 0.026, kill: 0.051, diffA: 1.2, diffB: 0.3, brushSize: 8, flowField: false },
  'Quantum Ripples': { feed: 0.082, kill: 0.059, diffA: 1.1, diffB: 0.4, brushSize: 12, flowField: true },
  'Fractal Dreams': { feed: 0.039, kill: 0.058, diffA: 0.9, diffB: 0.6, brushSize: 6, flowField: true },
};

const colorSchemes = {
  'Deep Space': {
    r: [20, 0, 100],
    g: [0, 50, 200],
    b: [50, 150, 255],
    steps: 3
  },
  'Volcanic': {
    r: [10, 200, 255],
    g: [0, 50, 100],
    b: [0, 0, 50],
    steps: 3
  },
  'Bioluminescence': {
    r: [0, 50, 150],
    g: [100, 200, 255],
    b: [50, 150, 200],
    steps: 3
  },
  'Quantum Field': {
    r: [100, 0, 255, 0],
    g: [0, 255, 0, 100],
    b: [255, 0, 100, 0],
    steps: 4
  }
};

const ReactionDiffusion = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const frameCountRef = useRef(0);

  const [feed, setFeed] = useState(0.0545);
  const [kill, setKill] = useState(0.062);
  const [diffusionA, setDiffusionA] = useState(1.0);
  const [diffusionB, setDiffusionB] = useState(0.5);
  const [brushSize, setBrushSize] = useState(15);
  const [useFlowField, setUseFlowField] = useState(true);

  const [selectedPreset, setSelectedPreset] = useState('Coral Growth');
  const [selectedColorScheme, setSelectedColorScheme] = useState('Deep Space');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    let imageData = ctx.getImageData(0, 0, width, height);
    let pixels = imageData.data;

    // Initialize concentrations with gradient patterns
    let a = new Array(width * height).fill(1);
    let b = new Array(width * height).fill(0);

    // Create initial flow field
    let flowField = new Array(width * height * 2).fill(0);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (x + y * width) * 2;
        flowField[index] = Math.sin(x * 0.1) * Math.cos(y * 0.1);
        flowField[index + 1] = Math.cos(x * 0.1) * Math.sin(y * 0.1);
      }
    }

    // Enhanced seeding pattern
    const seed = () => {
      // Create organic-looking initial patterns
      for (let i = 0; i < width * height * 0.1; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * Math.min(width, height) * 0.3;
        const x = Math.floor(width / 2 + Math.cos(angle) * radius);
        const y = Math.floor(height / 2 + Math.sin(angle) * radius);
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const index = x + y * width;
          b[index] = Math.random();
          // Create subtle variations in chemical A
          a[index] = 0.9 + Math.random() * 0.1;
        }
      }
    };

    seed();

    let animationFrameId;

    const updateFlowField = () => {
      const time = frameCountRef.current * 0.001;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (x + y * width) * 2;
          flowField[index] = Math.sin(x * 0.03 + time) * Math.cos(y * 0.02 + time);
          flowField[index + 1] = Math.cos(x * 0.02 + time) * Math.sin(y * 0.03 + time);
        }
      }
    };

    const addChemicals = () => {
      if (isDrawing) {
        const x = Math.floor(mousePosition.x);
        const y = Math.floor(mousePosition.y);
        
        for (let dy = -brushSize; dy <= brushSize; dy++) {
          for (let dx = -brushSize; dx <= brushSize; dx++) {
            const px = x + dx;
            const py = y + dy;
            
            if (px >= 0 && px < width && py >= 0 && py < height) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= brushSize) {
                const intensity = (1 - dist / brushSize) * 0.1;
                const index = px + py * width;
                b[index] = Math.min(b[index] + intensity, 1);
              }
            }
          }
        }
      }
    };

    const render = () => {
      if (!isRunning) {
        return;
      }

      frameCountRef.current++;
      if (useFlowField) {
        updateFlowField();
      }
      addChemicals();

      let aNext = new Array(width * height);
      let bNext = new Array(width * height);

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const index = x + y * width;

          // Enhanced Laplacian calculation with flow field influence
          let laplaceA = 0;
          let laplaceB = 0;

          const weights = [0.2, 0.15, 0.15, 0.15, 0.15, 0.05, 0.05, 0.05, 0.05];
          const offsets = [
            [0, 0], [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [1, -1], [-1, 1], [1, 1]
          ];

          for (let i = 0; i < weights.length; i++) {
            const [dx, dy] = offsets[i];
            const idx = (x + dx) + (y + dy) * width;
            laplaceA += weights[i] * (a[idx] - a[index]);
            laplaceB += weights[i] * (b[idx] - b[index]);
          }

          if (useFlowField) {
            const flowIndex = index * 2;
            const flowX = flowField[flowIndex];
            const flowY = flowField[flowIndex + 1];
            
            laplaceA += (flowX + flowY) * 0.05;
            laplaceB += (flowX - flowY) * 0.05;
          }

          // Enhanced reaction terms
          const reaction = a[index] * b[index] * b[index];
          const reactionModifier = 1 + 0.1 * Math.sin(frameCountRef.current * 0.01 + x * 0.1 + y * 0.1);

          aNext[index] = a[index] + (
            diffusionA * laplaceA - 
            reaction * reactionModifier + 
            feed * (1 - a[index])
          ) * 1.0;

          bNext[index] = b[index] + (
            diffusionB * laplaceB + 
            reaction * reactionModifier - 
            (kill + feed) * b[index]
          ) * 1.0;

          // Clamp values
          aNext[index] = Math.max(0, Math.min(1, aNext[index]));
          bNext[index] = Math.max(0, Math.min(1, bNext[index]));

          // Enhanced color mapping
          const value = (aNext[index] - bNext[index] + 1) * 0.5;
          const idx = index * 4;
          const color = getEnhancedColor(value);
          
          pixels[idx] = color.r;
          pixels[idx + 1] = color.g;
          pixels[idx + 2] = color.b;
          pixels[idx + 3] = 255;
        }
      }

      a = aNext;
      b = bNext;

      ctx.putImageData(imageData, 0, 0);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, feed, kill, diffusionA, diffusionB, selectedColorScheme, useFlowField, 
      mousePosition, isDrawing, brushSize]);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeout(() => {
      frameCountRef.current = 0;
      setIsRunning(true);
    }, 100);
  };

  const handlePresetChange = (e) => {
    const presetName = e.target.value;
    setSelectedPreset(presetName);
    const preset = presets[presetName];
    setFeed(preset.feed);
    setKill(preset.kill);
    setDiffusionA(preset.diffA);
    setDiffusionB(preset.diffB);
    setBrushSize(preset.brushSize);
    setUseFlowField(preset.flowField);
    handleReset();
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (isDrawing) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const getEnhancedColor = (value) => {
    const scheme = colorSchemes[selectedColorScheme];
    const steps = scheme.steps;
    const segment = Math.floor(value * (steps - 1));
    const t = (value * (steps - 1)) % 1;

    const r = interpolateColor(scheme.r[segment], scheme.r[segment + 1], t);
    const g = interpolateColor(scheme.g[segment], scheme.g[segment + 1], t);
    const b = interpolateColor(scheme.b[segment], scheme.b[segment + 1], t);

    return { r, g, b };
  };

  const interpolateColor = (start, end, t) => {
    return Math.floor(start + (end - start) * t);
  };
  
  // Update the return statement in ReactionDiffusion.jsx
  return (
    <div className="rd-container">
      <h2 className="rd-title">Neural Pattern Generator</h2>
      <div className="rd-canvas-container">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={800} 
          className="rd-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
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
            Pattern Preset
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
            Color Palette
            <select 
              value={selectedColorScheme} 
              onChange={(e) => setSelectedColorScheme(e.target.value)}
            >
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
              min="0.01"
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
              min="0.01"
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
              min="0.2"
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
              min="0.1"
              max="1.0"
              step="0.1"
              value={diffusionB}
              onChange={(e) => setDiffusionB(parseFloat(e.target.value))}
            />
          </label>
        </div>
        <div className="rd-slider-group">
          <label>
            Brush Size: {brushSize}
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
            />
          </label>
        </div>
        <div className="rd-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={useFlowField}
              onChange={(e) => setUseFlowField(e.target.checked)}
            />
            Enable Flow Field
          </label>
        </div>
      </div>
    </div>
  );
};

export default ReactionDiffusion;
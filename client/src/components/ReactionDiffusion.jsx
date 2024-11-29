// components/ReactionDiffusion.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../styles/global.css';

const PRESETS = {
  TURING_SPOTS: {
    name: "Turing Spots",
    diffusionA: 1.0,
    diffusionB: 0.5,
    feedRate: 0.055,
    killRate: 0.062
  },
  CORAL_GROWTH: {
    name: "Coral Growth",
    diffusionA: 1.0,
    diffusionB: 0.4,
    feedRate: 0.0367,
    killRate: 0.0649
  },
  FINGERPRINT: {
    name: "Fingerprint",
    diffusionA: 1.0,
    diffusionB: 0.6,
    feedRate: 0.037,
    killRate: 0.06
  },
  MAZE_PATTERN: {
    name: "Maze Pattern",
    diffusionA: 1.0,
    diffusionB: 0.5,
    feedRate: 0.029,
    killRate: 0.057
  }
};

const COLOR_SCHEMES = {
  thermal: ['#000000', '#ff0000', '#ffff00', '#ffffff'],
  ocean: ['#000033', '#0066ff', '#00ffff', '#ffffff'],
  forest: ['#003300', '#00ff00', '#ffff00', '#ffffff'],
  purple: ['#000033', '#6600ff', '#ff00ff', '#ffffff']
};

const ReactionDiffusion = () => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [preset, setPreset] = useState('TURING_SPOTS');
  const [params, setParams] = useState(PRESETS.TURING_SPOTS);
  const [colorScheme, setColorScheme] = useState('thermal');

  const handlePresetChange = (e) => {
    const newPreset = e.target.value;
    setPreset(newPreset);
    setParams(PRESETS[newPreset]);
  };

  const handleParameterChange = (param, value) => {
    setParams(prev => ({
      ...prev,
      [param]: parseFloat(value)
    }));
  };

  return (
    <div className="rd-container">
      <div className="rd-layout">
        <div className="rd-canvas-container">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="rd-canvas"
          />
        </div>

        <div className="rd-controls">
          <div className="rd-control-group">
            <label className="rd-label">Pattern Preset</label>
            <select
              className="rd-select"
              value={preset}
              onChange={handlePresetChange}
            >
              {Object.keys(PRESETS).map(key => (
                <option key={key} value={key}>
                  {PRESETS[key].name}
                </option>
              ))}
            </select>
          </div>

          <div className="rd-control-group">
            <h3 className="rd-label">Parameters</h3>
            
            <div>
              <label className="rd-label">
                Diffusion Rate A: {params.diffusionA.toFixed(3)}
              </label>
              <input
                type="range"
                className="rd-slider"
                min="0.1"
                max="1.0"
                step="0.1"
                value={params.diffusionA}
                onChange={(e) => handleParameterChange('diffusionA', e.target.value)}
              />
              <div className="rd-value-display">{params.diffusionA.toFixed(3)}</div>
            </div>

            {/* Similar controls for other parameters */}
            {/* ... */}
          </div>

          <div className="rd-control-group">
            <label className="rd-label">Color Scheme</label>
            <select
              className="rd-select"
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value)}
            >
              {Object.keys(COLOR_SCHEMES).map(scheme => (
                <option key={scheme} value={scheme}>
                  {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="rd-button-group">
            <button
              className="rd-button rd-button-primary"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              className="rd-button rd-button-secondary"
              onClick={() => {
                // Reset simulation
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReactionDiffusion;
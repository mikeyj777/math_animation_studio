// src/components/ReactionDiffusion.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  initWebGL,
  createShader,
  createProgram,
  checkWebGLCapabilities,
} from '../utils/webgl';
import { vertexShader, computeShader, displayShader } from './shaders/reaction-diffusion';

const PRESETS = {
  // ... (same as before)
};

const COLOR_SCHEMES = {
  // ... (same as before)
};

const ReactionDiffusion = () => {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const computeProgramRef = useRef(null);
  const displayProgramRef = useRef(null);
  const texturesRef = useRef([]);
  const framebuffersRef = useRef([]);
  const frameRef = useRef(null);

  const [currentTexture, setCurrentTexture] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [preset, setPreset] = useState('TURING_SPOTS');
  const [params, setParams] = useState(PRESETS.TURING_SPOTS);
  const [colorScheme, setColorScheme] = useState('thermal');
  const [error, setError] = useState(null);

  const initializeTexture = (gl, texture) => {
    const width = gl.canvas.width;
    const height = gl.canvas.height;
    const data = new Float32Array(width * height * 4);

    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const size = Math.floor(Math.min(width, height) / 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (Math.abs(x - centerX) < size && Math.abs(y - centerY) < size) {
          data[i] = 0; // A
          data[i + 1] = 1; // B
        } else {
          data[i] = 1; // A
          data[i + 1] = 0; // B
        }
        data[i + 2] = 0; // Unused
        data[i + 3] = 1; // Alpha
      }
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.FLOAT,
      data
    );
  };

  const createTexture = (gl, width, height) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Allocate empty texture
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.FLOAT,
      null
    );

    return texture;
  };

  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      const gl = initWebGL(canvas);
      glRef.current = gl;

      checkWebGLCapabilities(gl);

      // Enable required extensions
      const ext = gl.getExtension('OES_texture_float');
      if (!ext) {
        throw new Error('OES_texture_float extension not supported');
      }

      const linearExt = gl.getExtension('OES_texture_float_linear');
      const canUseLinearFiltering = !!linearExt;

      // Create shader programs
      const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShader);
      const computeFShader = createShader(gl, gl.FRAGMENT_SHADER, computeShader);
      const displayFShader = createShader(gl, gl.FRAGMENT_SHADER, displayShader);

      computeProgramRef.current = createProgram(gl, vShader, computeFShader);
      displayProgramRef.current = createProgram(gl, vShader, displayFShader);

      // Create textures and framebuffers
      const textures = [
        createTexture(gl, canvas.width, canvas.height),
        createTexture(gl, canvas.width, canvas.height),
      ];

      const framebuffers = [gl.createFramebuffer(), gl.createFramebuffer()];

      // Set up framebuffers
      framebuffers.forEach((fb, i) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          textures[i],
          0
        );
      });

      texturesRef.current = textures;
      framebuffersRef.current = framebuffers;

      // Initialize first texture with pattern
      initializeTexture(gl, textures[0]);

      // Set up vertex buffer
      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      // Set up attributes for compute program
      gl.useProgram(computeProgramRef.current);
      let position = gl.getAttribLocation(computeProgramRef.current, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      // Set up attributes for display program
      gl.useProgram(displayProgramRef.current);
      position = gl.getAttribLocation(displayProgramRef.current, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      return () => {
        cancelAnimationFrame(frameRef.current);
        gl.deleteProgram(computeProgramRef.current);
        gl.deleteProgram(displayProgramRef.current);
        gl.deleteShader(vShader);
        gl.deleteShader(computeFShader);
        gl.deleteShader(displayFShader);
        textures.forEach((texture) => gl.deleteTexture(texture));
        framebuffers.forEach((fb) => gl.deleteFramebuffer(fb));
      };
    } catch (err) {
      setError(err.message);
      console.error('WebGL initialization failed:', err);
    }
  }, []);

  const updateUniforms = (gl, program) => {
    gl.useProgram(program);
    gl.uniform2f(
      gl.getUniformLocation(program, 'uResolution'),
      gl.canvas.width,
      gl.canvas.height
    );
    gl.uniform1f(
      gl.getUniformLocation(program, 'uDiffusionA'),
      params.diffusionA
    );
    gl.uniform1f(
      gl.getUniformLocation(program, 'uDiffusionB'),
      params.diffusionB
    );
    gl.uniform1f(gl.getUniformLocation(program, 'uFeedRate'), params.feedRate);
    gl.uniform1f(gl.getUniformLocation(program, 'uKillRate'), params.killRate);
  };

  const updateColorUniforms = (gl, program) => {
    const colors = COLOR_SCHEMES[colorScheme].map((color) => {
      const hex = color.replace('#', '');
      return [
        parseInt(hex.substr(0, 2), 16) / 255,
        parseInt(hex.substr(2, 2), 16) / 255,
        parseInt(hex.substr(4, 2), 16) / 255,
      ];
    });

    gl.useProgram(program);
    gl.uniform3fv(
      gl.getUniformLocation(program, 'uColor1'),
      new Float32Array(colors[0])
    );
    gl.uniform3fv(
      gl.getUniformLocation(program, 'uColor2'),
      new Float32Array(colors[1])
    );
    gl.uniform3fv(
      gl.getUniformLocation(program, 'uColor3'),
      new Float32Array(colors[2])
    );
  };

  const animate = () => {
    if (!isPlaying || !glRef.current) {
      return;
    }

    const gl = glRef.current;
    const currentIdx = currentTexture;
    const nextIdx = 1 - currentIdx;

    // Computation step
    gl.useProgram(computeProgramRef.current);
    updateUniforms(gl, computeProgramRef.current);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffersRef.current[nextIdx]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texturesRef.current[currentIdx]);
    gl.uniform1i(
      gl.getUniformLocation(computeProgramRef.current, 'uTexture'),
      0
    );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Display step
    gl.useProgram(displayProgramRef.current);
    updateColorUniforms(gl, displayProgramRef.current);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texturesRef.current[nextIdx]);
    gl.uniform1i(
      gl.getUniformLocation(displayProgramRef.current, 'uTexture'),
      0
    );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    setCurrentTexture(nextIdx);
    frameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      frameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isPlaying, params, colorScheme]);

  const handlePresetChange = (e) => {
    const newPreset = e.target.value;
    setPreset(newPreset);
    setParams(PRESETS[newPreset]);
  };

  const handleParameterChange = (param, value) => {
    setParams((prev) => ({
      ...prev,
      [param]: parseFloat(value),
    }));
  };

  const handleReset = () => {
    if (!glRef.current || !texturesRef.current[0]) return;
    initializeTexture(glRef.current, texturesRef.current[0]);
  };

  if (error) {
    return (
      <div className="rd-error">
        <h2>WebGL Error</h2>
        <p>{error}</p>
      </div>
    );
  }

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
              {Object.keys(PRESETS).map((key) => (
                <option key={key} value={key}>
                  {PRESETS[key].name}
                </option>
              ))}
            </select>
          </div>

          <div className="rd-control-group">
            <h3 className="rd-label">Parameters</h3>

            {/* Diffusion Rate A */}
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
                onChange={(e) =>
                  handleParameterChange('diffusionA', e.target.value)
                }
              />
            </div>

            {/* Diffusion Rate B */}
            <div>
              <label className="rd-label">
                Diffusion Rate B: {params.diffusionB.toFixed(3)}
              </label>
              <input
                type="range"
                className="rd-slider"
                min="0.1"
                max="1.0"
                step="0.1"
                value={params.diffusionB}
                onChange={(e) =>
                  handleParameterChange('diffusionB', e.target.value)
                }
              />
            </div>

            {/* Feed Rate */}
            <div>
              <label className="rd-label">
                Feed Rate: {params.feedRate.toFixed(4)}
              </label>
              <input
                type="range"
                className="rd-slider"
                min="0.01"
                max="0.1"
                step="0.001"
                value={params.feedRate}
                onChange={(e) =>
                  handleParameterChange('feedRate', e.target.value)
                }
              />
            </div>

            {/* Kill Rate */}
            <div>
              <label className="rd-label">
                Kill Rate: {params.killRate.toFixed(4)}
              </label>
              <input
                type="range"
                className="rd-slider"
                min="0.01"
                max="0.1"
                step="0.001"
                value={params.killRate}
                onChange={(e) =>
                  handleParameterChange('killRate', e.target.value)
                }
              />
            </div>
          </div>

          <div className="rd-control-group">
            <label className="rd-label">Color Scheme</label>
            <select
              className="rd-select"
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value)}
            >
              {Object.keys(COLOR_SCHEMES).map((scheme) => (
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
              onClick={handleReset}
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

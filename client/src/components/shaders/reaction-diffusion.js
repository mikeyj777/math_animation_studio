// src/components/shaders/reaction-diffusion.js

export const vertexShader = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = 0.5 * (position + 1.0);
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const computeShader = `
  precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uDiffusionA;
uniform float uDiffusionB;
uniform float uFeedRate;
uniform float uKillRate;

varying vec2 vUv;

void main() {
    vec2 texelSize = 1.0 / uResolution;
    
    // Center and cardinal directions
    vec4 center = texture2D(uTexture, vUv);
    vec4 left = texture2D(uTexture, vUv + vec2(-1.0, 0.0) * texelSize);
    vec4 right = texture2D(uTexture, vUv + vec2(1.0, 0.0) * texelSize);
    vec4 top = texture2D(uTexture, vUv + vec2(0.0, 1.0) * texelSize);
    vec4 bottom = texture2D(uTexture, vUv + vec2(0.0, -1.0) * texelSize);
    
    // Diagonal directions
    vec4 topLeft = texture2D(uTexture, vUv + vec2(-1.0, 1.0) * texelSize);
    vec4 topRight = texture2D(uTexture, vUv + vec2(1.0, 1.0) * texelSize);
    vec4 bottomLeft = texture2D(uTexture, vUv + vec2(-1.0, -1.0) * texelSize);
    vec4 bottomRight = texture2D(uTexture, vUv + vec2(1.0, -1.0) * texelSize);
    
    float a = center.r;
    float b = center.g;
    
    // Improved Laplacian with diagonal terms (weighted appropriately)
    float laplaceA = (
        left.r + right.r + top.r + bottom.r + 
        0.5 * (topLeft.r + topRight.r + bottomLeft.r + bottomRight.r) - 
        (4.0 + 2.0) * center.r
    );
    
    float laplaceB = (
        left.g + right.g + top.g + bottom.g +
        0.5 * (topLeft.g + topRight.g + bottomLeft.g + bottomRight.g) - 
        (4.0 + 2.0) * center.g
    );
    
    // Reaction-diffusion equations
    float da = uDiffusionA * laplaceA - a * b * b + uFeedRate * (1.0 - a);
    float db = uDiffusionB * laplaceB + a * b * b - (uKillRate + uFeedRate) * b;
    
    // Time step (dt) is now adjustable based on rates to ensure stability
    float dt = 1.0 / max(uDiffusionA, uDiffusionB);
    dt = min(dt, 0.9); // Cap at 0.9 for stability
    dt = 0.1;
    float nextA = clamp(a + da * dt, 0.0, 1.0);
    float nextB = clamp(b + db * dt, 0.0, 1.0);
    
    gl_FragColor = vec4(nextA, nextB, 0.0, 1.0);
}
`;

export const displayShader = `
  precision highp float;
  
  uniform sampler2D uTexture;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  
  varying vec2 vUv;
  
  void main() {
    vec4 state = texture2D(uTexture, vUv);
    float value = state.r - state.g;
    
    vec3 color;
    if (value < 0.0) {
      color = mix(uColor1, uColor2, -value);
    } else {
      color = mix(uColor2, uColor3, value);
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
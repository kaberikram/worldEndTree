import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

// Gooey, animated blob branch shader
const GooeyBranchMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color('#FFD700'), // Golden yellow base color
    branchLength: 1.0,
    blobCenter: 0.0, // Normalized position (-0.5 to 0.5)
    blobSize: 0.25,   // Width of the blob in normalized units
    blobAmplitudeFactor: 2.8, // Increased for a more obvious physical bulge
    blobOpacityBoost: 0.45, // Increased for a more solid glowing blob
    glowColor: new THREE.Color('#FFEEAA'), // Lighter yellow for glow
    glowIntensity: 2.5, // Significantly increased for a stronger glow
  },
  // Vertex Shader (for mesh deformation)
  `
    uniform float time;
    uniform float branchLength;
    uniform float blobCenter;
    uniform float blobSize;
    uniform float blobAmplitudeFactor;
    varying vec2 vUv;
    varying float vNormalizedY; // Pass normalized Y to fragment shader

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Gooey displacement logic - more intense and sinewave-ish
      float baseAmplitude = 0.022; 
      float endSwellingMax = 0.028; 

      // Calculate normalized position along the cylinder's length (-0.5 to 0.5)
      vNormalizedY = pos.y / branchLength; // Also assign to varying
      
      float swellFactor = 1.0 + smoothstep(0.3, 0.5, abs(vNormalizedY)) * (endSwellingMax / baseAmplitude);
      float currentAmplitude = baseAmplitude * swellFactor;
      
      // Blob effect calculation
      float distToBlob = abs(vNormalizedY - blobCenter);
      float blobWave = smoothstep(blobSize * 0.5, 0.0, distToBlob); // 1 at blob center, 0 outside
      float effectiveAmplitude = currentAmplitude * (1.0 + blobWave * blobAmplitudeFactor);

      vec3 normalTransformed = normalMatrix * normal;
      
      float displacement = sin(time * 2.2 + pos.y * 3.5) * effectiveAmplitude * 1.2;
      displacement += cos(time * 3.8 + pos.x * 7.0) * effectiveAmplitude * 0.5; 

      vec3 displacedPosition = pos + normalTransformed * displacement;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
    }
  `,
  // Fragment Shader (updated for glowing bulge)
  `
    uniform float time;
    uniform vec3 color;
    uniform float blobCenter;
    uniform float blobSize;
    uniform float blobOpacityBoost;
    uniform vec3 glowColor;
    uniform float glowIntensity;
    varying vec2 vUv;
    varying float vNormalizedY; // Receive from vertex shader

    float pseudoNoise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 animatedUv = vUv;
      animatedUv.x += time * 0.03;
      animatedUv.y -= time * 0.05;

      float pattern = sin(animatedUv.y * 10.0 + time * 1.5) * 0.4;
      pattern += cos(animatedUv.x * 8.0 - time * 1.0) * 0.4;
      pattern += pseudoNoise(animatedUv * 5.0 + time * 0.2) * 0.3;
      pattern = (pattern + 1.0) / 2.0; 

      float distFromCenter = distance(vUv, vec2(0.5, 0.5));
      pattern *= (1.0 - distFromCenter * 0.8); 
      
      float alphaThreshold = 0.15; 
      float featherAmount = 0.35;  
      float baseAlpha = smoothstep(alphaThreshold - featherAmount, alphaThreshold + featherAmount, pattern);
      baseAlpha *= 0.5; 
      baseAlpha = clamp(baseAlpha, 0.0, 0.65);

      // Blob effect: opacity boost and glow
      float distToBlobFrag = abs(vNormalizedY - blobCenter);
      float blobEffectFactor = smoothstep(blobSize * 0.5, 0.0, distToBlobFrag); // 1 at blob center, 0 outside
      
      float finalAlpha = baseAlpha + blobEffectFactor * blobOpacityBoost;
      finalAlpha = clamp(finalAlpha, 0.0, 0.95); // Allow blob to be more opaque

      vec3 finalColor = color + glowColor * blobEffectFactor * glowIntensity;

      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `
)

// Extend the material to R3F
extend({ GooeyBranchMaterial })

export default GooeyBranchMaterial 
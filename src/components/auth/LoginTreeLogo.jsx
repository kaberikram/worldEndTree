import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { KernelSize } from 'postprocessing'
import * as THREE from 'three'
import GooeyBranchMaterial from '../materials/GooeyBranchMaterial'

// Internal component for the 3D content of the logo, to use R3F hooks
function LogoSceneContent() {
  const materialRefs = useRef([]);
  const sphereMeshRefs = useRef([]); // Refs for sphere meshes
  const lineMeshRefs = useRef([]);   // Refs for line meshes

  const sphereBaseColor = '#D4AF37'; 
  const sphereGlowColor = new THREE.Color('#FFEEAA'); 

  // Final positions for a more organic, asymmetrical tree-like look
  const finalSpherePositions = useMemo(() => [
    [0, 0, 0],          // 0: Center sphere (root/base)
    [0.1, 1.5, 0.1],    // 1: Top-ish
    [1.3, 0.2, -0.2],   // 2: Right-ish
    [0.7, -1.2, 0.15],  // 3: Bottom-right-ish
    [-0.9, -0.8, -0.1], // 4: Bottom-left-ish
    [-1.1, 0.6, 0.25]   // 5: Left-ish
  ], []);

  const lineConnections = useMemo(() => [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]
  ], []);

  const expandDuration = 1.5; // seconds
  const holdExpandedDuration = 3.5; // seconds - increased for better visibility
  const contractDuration = 1.5; // seconds
  const holdContractedDuration = 0.5; // seconds
  const totalCycleDuration = expandDuration + holdExpandedDuration + contractDuration + holdContractedDuration;

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    const cycleTime = elapsedTime % totalCycleDuration;

    let lerpFactor;
    const PI = Math.PI;

    if (cycleTime < expandDuration) {
      // Phase 1: Expanding (Sinusoidal Ease In-Out)
      const x = cycleTime / expandDuration;
      lerpFactor = 0.5 * (1 - Math.cos(PI * x));
    } else if (cycleTime < expandDuration + holdExpandedDuration) {
      // Phase 2: Holding Expanded
      lerpFactor = 1;
    } else if (cycleTime < expandDuration + holdExpandedDuration + contractDuration) {
      // Phase 3: Contracting (Sinusoidal Ease In-Out, reversed)
      const timeInContractPhase = cycleTime - (expandDuration + holdExpandedDuration);
      const x = timeInContractPhase / contractDuration;
      lerpFactor = 1 - (0.5 * (1 - Math.cos(PI * x)));
    } else {
      // Phase 4: Holding Contracted
      lerpFactor = 0;
    }

    const centerPosVec = new THREE.Vector3(...finalSpherePositions[0]);
    const blobAnimationSpeed = 0.2;

    // Update sphere positions (outer spheres)
    finalSpherePositions.forEach((posArray, index) => {
      if (index === 0) { // Center sphere
        if (sphereMeshRefs.current[index]) {
           sphereMeshRefs.current[index].position.copy(centerPosVec);
        }
        return;
      }
      // Outer spheres
      if (sphereMeshRefs.current[index]) {
        const targetPosVec = new THREE.Vector3(...posArray);
        const currentPos = new THREE.Vector3().lerpVectors(centerPosVec, targetPosVec, lerpFactor);
        sphereMeshRefs.current[index].position.copy(currentPos);
      }
    });

    // Update line positions, orientations, scales, and material uniforms
    lineConnections.forEach((conn, lineIndex) => {
      const startSphereIndex = conn[0]; 
      const endSphereIndex = conn[1];

      const lineMesh = lineMeshRefs.current[lineIndex];
      const lineMaterial = materialRefs.current[lineIndex];

      if (lineMesh && lineMaterial && sphereMeshRefs.current[startSphereIndex] && sphereMeshRefs.current[endSphereIndex]) {
        const startPos = sphereMeshRefs.current[startSphereIndex].position;
        const endPos = sphereMeshRefs.current[endSphereIndex].position;

        const direction = new THREE.Vector3().subVectors(endPos, startPos);
        const distance = direction.length();

        // Hide branches when lerpFactor is very low (spheres are contracting) or distance is too small
        if (lerpFactor < 0.1 || distance < 0.05) {
          lineMesh.visible = false;
          lineMesh.scale.set(1, 0.0001, 1);    // Keep it tiny and effectively invisible
        } else {
          lineMesh.visible = true;
          direction.normalize();
          const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
          
          const cylinderUp = new THREE.Vector3(0, 1, 0);
          if (direction.lengthSq() > 0.000001) { // Ensure direction is not zero vector
             const tempQuaternion = new THREE.Quaternion(); // Use a temporary quaternion
             tempQuaternion.setFromUnitVectors(cylinderUp, direction);
             lineMesh.quaternion.copy(tempQuaternion);
          } else {
             // Optional: if direction is somehow zero here, set a default orientation
             lineMesh.quaternion.identity(); 
          }

          lineMesh.position.copy(midPoint);
          lineMesh.scale.set(1, distance, 1); 

          lineMaterial.uniforms.branchLength.value = distance;
          lineMaterial.time = elapsedTime; // For overall shader patterns
          lineMaterial.uniforms.blobCenter.value = (elapsedTime * blobAnimationSpeed) % 1.0 - 0.5; // For blob movement
        }
      }
    });
  });

  return (
    <>
      <ambientLight intensity={0.7 * Math.PI} />
      <pointLight position={[7, 7, 7]} intensity={0.8 * Math.PI} castShadow />
      <pointLight position={[-7, -7, 7]} intensity={0.4 * Math.PI} />

      {/* Render Spheres */}
      {finalSpherePositions.map((pos, index) => (
        <mesh 
          key={`sphere-${index}`} 
          ref={el => sphereMeshRefs.current[index] = el}
          // Initial position will be set by useFrame, but can set to center for frame 0
          position={index === 0 ? finalSpherePositions[0] : finalSpherePositions[0]} 
        >
          <sphereGeometry args={[index === 0 ? 0.33 : 0.22, 20, 20]} />
          <meshStandardMaterial
            color={sphereGlowColor}
            emissive={sphereGlowColor}
            emissiveIntensity={0.6}
            metalness={0.3}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* Render Lines (Branches) */}
      {lineConnections.map((conn, index) => {
        // Initial setup for lines. Position, scale, orientation will be driven by useFrame.
        // Cylinder height is 1, actual length controlled by Y scale.
        return (
          <mesh
            key={`line-${index}`}
            ref={el => lineMeshRefs.current[index] = el}
            // Initial properties will be immediately overwritten by useFrame
            // position={[0,0,0]} // Example, doesn't really matter
            // scale={[1,0.001,1]} // Start tiny
          >
            <cylinderGeometry args={[0.035, 0.035, 1, 12, 1]} /> 
            <gooeyBranchMaterial 
              ref={el => materialRefs.current[index] = el}
              attach="material"
              color="#80c7ff"
              branchLength={0.001} // Initial, will be updated
              transparent
              depthWrite={false}
            />
          </mesh>
        );
      })}
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        enableRotate={false} 
        autoRotate 
        autoRotateSpeed={0.6} 
      />
    </>
  );
}

// LoginTreeLogo Component now just sets up the Canvas and includes LogoSceneContent
function LoginTreeLogo() {
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw', 
      height: '100vh',
      pointerEvents: 'none', // Allow clicks to pass through to underlying elements
      zIndex: 0 // Behind other UI elements
    }}>
      <Canvas 
        camera={{ position: [0, 2, 15], fov: 35 }} // Moved camera further back from 8 to 15
        style={{ 
          width: '100%',
          height: '100%',
          display: 'block'
        }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['black']} />
        <group position={[0, 3, 0]} scale={0.6534}> {/* Increased scale by 20% from 0.5445 to 0.6534 */}
          <LogoSceneContent />
        </group>
        <EffectComposer>
          <Bloom 
            intensity={1.2} 
            luminanceThreshold={0.4}
            luminanceSmoothing={0.2}
            mipmapBlur={true}
            kernelSize={KernelSize.SMALL}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default LoginTreeLogo 
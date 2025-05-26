import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import '../materials/GooeyBranchMaterial'
import { playAppear } from '../../utils/sfx'

const BRANCH_APPEAR_ANIMATION_DURATION = 500; // ms

function Branch({ startPoint, endPoint, animationOffset = 0, appearDelay = 0 }) {
  const groupRef = useRef() // Changed branchRef to groupRef for clarity with scale
  const materialRef = useRef()
  
  const [currentScale, setCurrentScale] = useState(0.01)
  const [animationStartTime, setAnimationStartTime] = useState(null)

  useEffect(() => {
    // Set the time when this branch should start its appear animation
    // performance.now() is generally more reliable for animation timing than Date.now()
    const now = performance.now();
    setAnimationStartTime(now + appearDelay);
    setCurrentScale(0.01); // Reset scale if component re-renders with new delay
    if (appearDelay === 0) playAppear();
    else setTimeout(() => playAppear(), appearDelay);
  }, [appearDelay]);

  const { position, quaternion, length } = useMemo(() => {
    const start = new THREE.Vector3(...startPoint)
    const end = new THREE.Vector3(...endPoint)
    const dir = end.clone().sub(start)
    const len = dir.length()
    if (len === 0) return { position: [0,0,0], quaternion: new THREE.Quaternion(), length: 0 }
    dir.normalize()
    const mid = start.clone().add(end).multiplyScalar(0.5)
    const quat = new THREE.Quaternion()
    const cylinderUp = new THREE.Vector3(0, 1, 0)
    quat.setFromUnitVectors(cylinderUp, dir)
    
    return { position: [mid.x, mid.y, mid.z], quaternion: quat, length: len }
  }, [startPoint, endPoint])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.branchLength.value = length
    }
  }, [length])

  useFrame(({ clock }) => {
    // Animate scale if animationStartTime is set and current time is past it
    if (animationStartTime && performance.now() >= animationStartTime && currentScale < 1) {
      const elapsedTimeSinceStart = performance.now() - animationStartTime;
      let newScale = (elapsedTimeSinceStart / BRANCH_APPEAR_ANIMATION_DURATION);
      newScale = Math.min(newScale, 1); // Clamp to 1
      setCurrentScale(newScale);
    }

    if (materialRef.current) {
      materialRef.current.time = clock.getElapsedTime() // General time for other shader effects
      
      const effectiveAnimationTime = Math.max(0, clock.getElapsedTime() - animationOffset)
      const speed = 0.2
      materialRef.current.uniforms.blobCenter.value = (effectiveAnimationTime * speed) % 1.0 - 0.5
    }
  })

  if (length < 0.01) return null

  return (
    // Apply scale directly to the group
    <group ref={groupRef} scale={currentScale > 0.001 ? currentScale : 0.001} > 
      <mesh 
        // ref is no longer needed on mesh if group controls scale/position from props
        position={position} 
        quaternion={quaternion}
        renderOrder={0}
      >
        <cylinderGeometry args={[0.03, 0.03, length, 24, 4, false]} /> 
        <gooeyBranchMaterial 
          ref={materialRef} 
          color="#80c7ff" 
          transparent 
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export default Branch 
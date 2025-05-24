import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import '../materials/GooeyBranchMaterial'

function Branch({ startPoint, endPoint, animationOffset = 0 }) {
  const branchRef = useRef()
  const materialRef = useRef()

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
    if (materialRef.current) {
      materialRef.current.time = clock.getElapsedTime() // General time for other shader effects
      
      // Calculate effective time for this branch's blob animation, considering the offset
      const effectiveAnimationTime = Math.max(0, clock.getElapsedTime() - animationOffset)
      
      // Animate blobCenter: loop from -0.5 to 0.5 along the branch
      const speed = 0.2 // Controls speed of blob movement (normalized units per second)
      materialRef.current.uniforms.blobCenter.value = (effectiveAnimationTime * speed) % 1.0 - 0.5
    }
  })

  if (length < 0.01) return null

  return (
    <mesh 
      ref={branchRef} 
      position={position} 
      quaternion={quaternion}
      renderOrder={0} // Render branches before planes
    >
      {/* Adjusted radius and radial segments for thinner branches */}
      <cylinderGeometry args={[0.03, 0.03, length, 24, 4, false]} /> 
      <gooeyBranchMaterial 
        ref={materialRef} 
        color="#80c7ff" 
        transparent 
        depthWrite={false} // Explicitly false for transparent branches
      />
    </mesh>
  )
}

export default Branch 
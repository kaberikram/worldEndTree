import { useRef, useState, useEffect, useMemo } from 'react'
import { useTexture, Billboard, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { playSelect, playAppear } from '../../utils/sfx'

const SONG_NODE_APPEAR_ANIMATION_DURATION = 500; // ms

function SongNode(props) {
  const { 
    position, 
    albumArtUrl, 
    trackName, 
    id: spotifyId, 
    rank, 
    appearDelay = 0, 
    isUserProfile = false, // Destructure isUserProfile, default to false
    isSelected = false,
    trackIndex,
    ...rest 
  } = props

  const meshRef = useRef()
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)

  const [currentAppearScale, setCurrentAppearScale] = useState(0.01)
  const [animationStartTime, setAnimationStartTime] = useState(null)

  useEffect(() => {
    const now = performance.now();
    setAnimationStartTime(now + appearDelay);
    setCurrentAppearScale(0.01); // Reset scale if component re-renders
  }, [appearDelay]);

  useFrame(() => {
    if (animationStartTime && performance.now() >= animationStartTime && currentAppearScale < 1) {
      const elapsedTimeSinceStart = performance.now() - animationStartTime;
      let newScale = (elapsedTimeSinceStart / SONG_NODE_APPEAR_ANIMATION_DURATION);
      newScale = Math.min(newScale, 1); // Clamp to 1
      setCurrentAppearScale(newScale);
    }
  })

  const texture = albumArtUrl ? useTexture(albumArtUrl) : null
  const planeSize = 1.76

  // SVG for rounded corners alpha map
  // A 100x100 viewbox, with a rect having rx=15 (15% corner radius)
  const roundedRectSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="0" y="0" width="100" height="100" rx="15" ry="15" fill="white" />
    </svg>
  `;

  const circleSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="white" />
    </svg>
  `;

  const chosenSvg = isUserProfile ? circleSvg : roundedRectSvg;
  const alphaMapTexture = useTexture(`data:image/svg+xml;base64,${btoa(chosenSvg)}`);

  useEffect(() => {
    if (alphaMapTexture) {
      alphaMapTexture.magFilter = THREE.LinearFilter;
      alphaMapTexture.minFilter = THREE.LinearFilter;
    }
  }, [alphaMapTexture]);

  // Combine the appear scale with the click scale
  const combinedScale = useMemo(() => {
    return currentAppearScale * (clicked && !isUserProfile ? 1.25 : 1); // Click scale only for non-profile nodes
  }, [currentAppearScale, clicked, isUserProfile]);

  return (
    <Billboard 
      position={position} 
      scale={combinedScale > 0.001 ? combinedScale : 0.001} 
      {...rest}
    >
      {isSelected && trackName && (
        <Billboard position={[0, 1.2, 0]}>
          <Html center style={{
            pointerEvents: 'none',
            color: '#fff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 500,
            fontSize: '0.9em',
            letterSpacing: '1px',
            textAlign: 'center',
            textShadow: '0 2px 8px #000',
            whiteSpace: 'nowrap',
            border: '1.5px solid #fff',
            borderRadius: '20px',
            background: 'rgba(0,0,0,0.18)',
            padding: '4px 14px',
            boxSizing: 'border-box',
            minWidth: '0',
            display: 'inline-block',
          }}>
            {`${trackIndex + 1}. ${trackName}`}
          </Html>
        </Billboard>
      )}
      <mesh
        ref={meshRef}
        renderOrder={1}
        onClick={(event) => {
          if (isUserProfile) return; // Disable click for user profile
          event.stopPropagation()
          click(!clicked)
          if (trackName) {
            console.log('Clicked track:', trackName, 'at position:', position, 'Spotify ID:', spotifyId, 'Rank:', rank)
          }
          playSelect();
        }}
        onPointerOver={(event) => {
          if (isUserProfile) return; // Disable hover for user profile
          event.stopPropagation()
          hover(true)
        }}
        onPointerOut={(event) => {
          if (isUserProfile) return; // Disable hover for user profile
          hover(false)
        }}>
        <planeGeometry args={[planeSize, planeSize]} />
        <meshStandardMaterial 
          color={hovered && !texture && !isUserProfile ? 'hotpink' : (texture ? 'white' : 'skyblue')}
          map={texture}
          alphaMap={alphaMapTexture}
          transparent={true}
          opacity={texture ? 1 : 0.9}
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>
    </Billboard>
  )
}

export default SongNode 
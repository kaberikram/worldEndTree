import { useRef, useState } from 'react'
import { useTexture, Billboard } from '@react-three/drei'
import * as THREE from 'three'

function SongNode(props) {
  const { position, albumArtUrl, trackName, id: spotifyId, rank, ...rest } = props

  const meshRef = useRef()
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)

  const texture = albumArtUrl ? useTexture(albumArtUrl) : null

  const planeSize = 2.2

  return (
    <Billboard position={position} {...rest}>
      <mesh
        ref={meshRef}
        renderOrder={1}
        scale={clicked ? 1.25 : 1}
        onClick={(event) => {
          event.stopPropagation()
          click(!clicked)
          if (trackName) {
            console.log('Clicked track:', trackName, 'at position:', position, 'Spotify ID:', spotifyId, 'Rank:', rank)
          }
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          hover(true)
        }}
        onPointerOut={(event) => hover(false)}>
        <planeGeometry args={[planeSize, planeSize]} />
        <meshStandardMaterial 
          color={hovered && !texture ? 'hotpink' : (texture ? 'white' : 'skyblue')}
          map={texture}
          transparent
          opacity={texture ? 1 : 0.9}
          side={THREE.DoubleSide}
          depthTest={false} // Kept from previous step
        />
      </mesh>
    </Billboard>
  )
}

export default SongNode 
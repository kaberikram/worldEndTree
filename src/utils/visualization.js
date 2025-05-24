import * as THREE from 'three'

// Calculate mind map elements from track data
export function generateMindMapElements(topTracks, centralNodePosition = new THREE.Vector3(0, 0, 0)) {
  if (!topTracks) return []
  
  const elements = []
  let firstNodePositionArray = [0, 0, 0]

  topTracks.forEach((track, index) => {
    const rank = index + 1
    const albumArtUrl = track.album?.images?.[0]?.url
    let nodePositionVec = new THREE.Vector3()
    let branchStartPointVec = new THREE.Vector3().copy(centralNodePosition)

    if (rank === 1) {
      nodePositionVec.copy(centralNodePosition)
      firstNodePositionArray = nodePositionVec.toArray()
    } else {
      const angle = ((index - 1) / (topTracks.length - 1)) * Math.PI * 2 + (Math.random() - 0.5) * 0.8
      const yAngle = (Math.random() - 0.5) * Math.PI * 0.4
      const baseRadius = 4
      const radiusIncrement = 0.7
      const radius = baseRadius + (rank - 2) * radiusIncrement * (1 + (Math.random() - 0.5) * 0.6)
      
      nodePositionVec.set(
        radius * Math.cos(angle) * Math.cos(yAngle),
        radius * Math.sin(yAngle),
        radius * Math.sin(angle) * Math.cos(yAngle)
      )
      nodePositionVec.add(centralNodePosition)
      branchStartPointVec.fromArray(firstNodePositionArray)
    }

    elements.push({
      type: 'node',
      id: track.id,
      position: nodePositionVec.toArray(),
      trackName: track.name,
      albumArtUrl: albumArtUrl,
      rank: rank,
    })

    if (rank > 1) {
      elements.push({
        type: 'branch',
        id: `branch-${track.id}`,
        startPoint: branchStartPointVec.toArray(),
        endPoint: nodePositionVec.toArray(),
      })
    }
  })

  return elements
}

// Filter elements by type
export function filterElementsByType(elements, type) {
  return elements.filter(el => el.type === type)
} 
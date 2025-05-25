import * as THREE from 'three'

// Calculate mind map elements from track data
export function generateMindMapElements(topTracks, centralNodePosition = new THREE.Vector3(0, 0, 0), userProfileImageUrl = null) {
  if (!topTracks) return []
  
  const elements = []
  const userNodePositionVec = new THREE.Vector3().copy(centralNodePosition)

  // 1. Create the central user profile node if image URL is available
  if (userProfileImageUrl) {
    elements.push({
      type: 'node',
      id: 'user-profile-node', // Special ID for the user profile
      position: userNodePositionVec.toArray(),
      trackName: 'Your Profile', // Or some other identifier
      albumArtUrl: userProfileImageUrl,
      rank: 0, // Rank 0 for the user profile node
      isUserProfile: true // Custom flag
    })
  }

  // 2. Create nodes and branches for each top track, all originating from the central user node
  topTracks.forEach((track, index) => {
    const rank = index + 1 // Original rank for sorting/display if needed
    const albumArtUrl = track.album?.images?.[0]?.url
    let nodePositionVec = new THREE.Vector3()
    
    // All branches start from the central user node position
    const branchStartPointVec = new THREE.Vector3().copy(userNodePositionVec)

    // Calculate position for this track node relative to the central user node
    // The first track (rank 1) will be closer, subsequent tracks spread out
    const angle = (index / topTracks.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.5; // Spread all tracks
    const yAngle = (Math.random() - 0.5) * Math.PI * 0.45;
    const baseRadius = rank === 1 ? 3.5 : 4.5; // Rank 1 slightly closer than others
    const radiusIncrement = 0.6;
    // Adjust radius calculation: index is 0 for 1st track, 1 for 2nd, etc.
    const radius = baseRadius + index * radiusIncrement * (1 + (Math.random() - 0.5) * 0.4);
    
    nodePositionVec.set(
      radius * Math.cos(angle) * Math.cos(yAngle),
      radius * Math.sin(yAngle),
      radius * Math.sin(angle) * Math.cos(yAngle)
    )
    nodePositionVec.add(userNodePositionVec) // Add to central position to make it relative

    elements.push({
      type: 'node',
      id: track.id,
      position: nodePositionVec.toArray(),
      trackName: track.name,
      albumArtUrl: albumArtUrl,
      rank: rank, 
    })

    // Create a branch from the user node to this track node
    elements.push({
      type: 'branch',
      id: `branch-${track.id}`,
      startPoint: branchStartPointVec.toArray(),
      endPoint: nodePositionVec.toArray(),
    })
  })

  return elements
}

// Filter elements by type
export function filterElementsByType(elements, type) {
  return elements.filter(el => el.type === type)
} 
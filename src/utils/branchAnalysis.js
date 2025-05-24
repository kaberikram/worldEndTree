// Branch Analysis Utility for World End Tree
// Analyzes user's Spotify listening data to determine their "sonic identity"

// Category definitions with their characteristics
const CATEGORY_PROFILES = {
  'Verdant Canopy': {
    genres: ['pop', 'indie pop', 'indie rock', 'folk pop', 'acoustic', 'world music', 'electronic'],
    description: "Your musical essence resonates with the vibrant growth of the Verdant Canopy. You thrive on diverse, melodic sounds that bring a sense of interconnectedness and vitality."
  },
  'Deeproot Dweller': {
    genres: ['metal', 'heavy metal', 'progressive metal', 'industrial', 'techno', 'hip hop', 'doom', 'stoner rock'],
    description: "Your listening soul delves into the profound power of the Deeproot Dweller. You seek foundational, heavy sounds that explore immense depths and raw gravity."
  },
  'Aetherial Bloom': {
    genres: ['ambient', 'dream pop', 'chillwave', 'electronic', 'new age', 'soundtrack', 'classical'],
    description: "Your essence shimmers with the enchantment of Aetherial Bloom. You are drawn to ethereal, atmospheric sounds that inspire transcendence and subtle beauty."
  },
  'Dawning Spire': {
    genres: ['power metal', 'arena rock', 'orchestral', 'trance', 'edm', 'pop', 'folk rock'],
    description: "Your sonic identity ascends like the Dawning Spire. You gravitate towards grand, triumphant sounds that evoke aspiration and victory."
  },
  'Whispering Bark': {
    genres: ['lo-fi', 'indie', 'experimental', 'folk', 'minimalist'],
    description: "Your essence holds the subtle truths of Whispering Bark. You appreciate raw, authentic sounds, textured and subtly complex, hinting at enduring essence."
  },
  'Celestial Echo': {
    genres: ['post-rock', 'space rock', 'drone', 'black metal', 'ambient', 'electronic'],
    description: "Your spirit resonates with the infinite expanse of Celestial Echo. You seek vast, cosmic sounds that inspire a sense of universal connection and profound resonance."
  },
  'Blighted Thorn': {
    genres: ['gothic', 'darkwave', 'emo', 'pop punk', 'r&b', 'soul', 'symphonic metal', 'indie'],
    description: "Your listening reveals the poignant intensity of Blighted Thorn. You are drawn to dramatic, emotionally charged sounds, often with a passionate or melancholic edge."
  },
  'Shadowed Heart': {
    genres: ['dark ambient', 'drone', 'techno', 'metal', 'doom', 'jazz', 'industrial'],
    description: "Your essence delves into the profound depths of Shadowed Heart. You prefer dark, brooding sounds that evoke introspection, mystery, and solemnity."
  },
  'Ancient Sap': {
    genres: ['folk', 'world music', 'tribal', 'acoustic', 'indigenous', 'latin', 'african'],
    description: "Your sonic identity flows with the life force of Ancient Sap. You connect with natural, earthy sounds, finding grounding and inherent rhythm in organic melodies."
  },
  'Fading Glyph': {
    genres: ['sadcore', 'slowcore', 'ambient', 'shoegaze', 'indie folk', 'black metal', 'jazz', 'blues'],
    description: "Your spirit holds the serene reflection of Fading Glyph. You are drawn to melancholic, atmospheric sounds that evoke quiet memory and introspective beauty."
  }
}

// Normalize genre names to match category profiles
function normalizeGenre(genre) {
  const normalized = genre.toLowerCase()
  
  // Genre mapping logic
  if (normalized.includes('metal')) return 'metal'
  if (normalized.includes('pop') && !normalized.includes('dream')) return 'pop'
  if (normalized.includes('indie')) return 'indie'
  if (normalized.includes('rock')) return 'rock'
  if (normalized.includes('electronic') || normalized.includes('edm')) return 'electronic'
  if (normalized.includes('hip hop') || normalized.includes('rap')) return 'hip hop'
  if (normalized.includes('folk')) return 'folk'
  if (normalized.includes('ambient')) return 'ambient'
  if (normalized.includes('jazz')) return 'jazz'
  if (normalized.includes('classical')) return 'classical'
  if (normalized.includes('world')) return 'world music'
  
  return normalized
}

// Get top genres from tracks
function getTopGenres(tracks) {
  const genreCount = {}
  
  tracks.forEach(track => {
    track.artists.forEach(artist => {
      if (artist.genres) {
        artist.genres.forEach(genre => {
          const normalized = normalizeGenre(genre)
          genreCount[normalized] = (genreCount[normalized] || 0) + 1
        })
      }
    })
  })
  
  return Object.entries(genreCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre)
}

// Analyze and categorize user's listening data based on genres
export function analyzeBranch(tracks) {
  try {
    // Get top genres
    const topGenres = getTopGenres(tracks)
    
    if (topGenres.length === 0) {
      throw new Error('No genres found in your top tracks')
    }
    
    // Initialize scores for each category
    const scores = {}
    Object.keys(CATEGORY_PROFILES).forEach(category => {
      scores[category] = { total_score: 0, genre_matches: [] }
    })
    
    // Calculate genre scores
    topGenres.forEach((genre, index) => {
      // Weight scores by genre ranking (top genre gets 5 points, then 4, 3, 2, 1)
      const points = Math.max(5 - index, 1)
      
      Object.entries(CATEGORY_PROFILES).forEach(([categoryName, profile]) => {
        const matchingGenres = profile.genres.filter(catGenre => 
          genre.includes(catGenre) || catGenre.includes(genre)
        )
        
        if (matchingGenres.length > 0) {
          scores[categoryName].total_score += points
          scores[categoryName].genre_matches.push({
            user_genre: genre,
            category_genres: matchingGenres,
            points: points
          })
        }
      })
    })
    
    // Find winning category
    let winningCategory = null
    let highestScore = -1
    
    Object.entries(scores).forEach(([categoryName, scoreData]) => {
      if (scoreData.total_score > highestScore) {
        winningCategory = categoryName
        highestScore = scoreData.total_score
      }
    })
    
    // Fallback if no clear winner
    if (!winningCategory || highestScore === 0) {
      winningCategory = 'Verdant Canopy' // Default to most general category
    }
    
    // Create analysis summary
    const topGenresText = topGenres.slice(0, 3).join(', ')
    const analysisText = `Your connection to ${winningCategory} was revealed through your deep affinity for ${topGenresText} sounds, drawing you naturally to this mystical branch of the World End Tree.`
    
    return {
      determined_category: winningCategory,
      category_description: CATEGORY_PROFILES[winningCategory].description,
      analysis_summary: analysisText,
      score_breakdown: scores,
      user_data: {
        top_genres: topGenres,
        winning_score: highestScore
      }
    }
    
  } catch (error) {
    console.error('Error in branch analysis:', error)
    throw error
  }
} 
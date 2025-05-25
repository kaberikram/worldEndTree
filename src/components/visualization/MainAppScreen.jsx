import { useEffect, useState, useMemo, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { KernelSize } from 'postprocessing'
import * as THREE from 'three'

import useAuthStore from '../../store/authStore'
import { generateMindMapElements, filterElementsByType } from '../../utils/visualization'
import { analyzeBranch } from '../../utils/branchAnalysis'
import SongNode from './SongNode'
import Branch from './Branch'
import TracksList from './TracksList'

function MainAppScreen() {
  const { getValidAccessToken, isAuthenticated, clearTokens } = useAuthStore()
  const [topTracks, setTopTracks] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [showResultsPage, setShowResultsPage] = useState(false)
  const [contentOpacity, setContentOpacity] = useState(0)
  const [isInitialLoadTransitionDone, setIsInitialLoadTransitionDone] = useState(false)
  const [loadingScreenOpacity, setLoadingScreenOpacity] = useState(1)
  const [userProfileImageUrl, setUserProfileImageUrl] = useState(null)
  const navigate = useNavigate()

  const FADE_DURATION = 500 // ms, matches CSS transition
  const BRANCH_ANIMATION_START_DELAY = FADE_DURATION + 100; // Start branch animation after page fade
  const BRANCH_STAGGER_DELAY = 150; // Delay between each branch appearing
  const BRANCH_APPEAR_DURATION = 500; // Matching Branch.jsx constant

  const SONG_NODE_STAGGER_DELAY = 150; // Same as branch for simplicity, or can differ
  // Song nodes start animating slightly after their branch finishes appearing
  const SONG_NODE_ANIMATION_START_OFFSET = BRANCH_APPEAR_DURATION + 50; // Start 50ms after branch finishes

  const handleLogout = () => {
    clearTokens()
    navigate('/')
  }

  // Fetch artist details to get genres
  const fetchArtistDetails = async (artistIds, token) => {
    try {
      const idsString = artistIds.join(',')
      const response = await fetch(`https://api.spotify.com/v1/artists?ids=${idsString}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch artist details')
      }
      
      const data = await response.json()
      return data.artists
    } catch (error) {
      console.error('Error fetching artist details:', error)
      throw error
    }
  }

  const handleAnalyzeBranch = async () => {
    if (!topTracks || analyzing) return
    
    setAnalyzing(true)
    setError(null)
    
    try {
      const token = await getValidAccessToken()
      if (!token) {
        throw new Error('Authentication required')
      }
      
      const artistIds = [...new Set(
        topTracks.flatMap(track => track.artists.map(artist => artist.id))
      )]
      
      const artistDetails = await fetchArtistDetails(artistIds, token)
      
      const artistGenresMap = {}
      artistDetails.forEach(artist => {
        artistGenresMap[artist.id] = artist.genres || []
      })
      
      const enhancedTracks = topTracks.map(track => ({
        ...track,
        artists: track.artists.map(artist => ({
          ...artist,
          genres: artistGenresMap[artist.id] || []
        }))
      }))
      
      const result = analyzeBranch(enhancedTracks)
      
      setTimeout(() => {
        setAnalysisResult(result)
        setContentOpacity(0)
        setTimeout(() => {
          setShowResultsPage(true)
          requestAnimationFrame(() => {
            setContentOpacity(1)
          })
          setAnalyzing(false)
        }, FADE_DURATION)
      }, 3000)
      
    } catch (err) {
      console.error('Error analyzing branch:', err)
      setError(`Analysis failed: ${err.message}`)
      setContentOpacity(1)
      setAnalyzing(false)
    }
  }

  const handleBackToTree = () => {
    setContentOpacity(0) // Start fade-out
    setTimeout(() => {
      setShowResultsPage(false)
      setAnalysisResult(null)
      requestAnimationFrame(() => {
        setContentOpacity(1) // Fade in 3D tree
      })
    }, FADE_DURATION)
  }

  useEffect(() => {
    const fetchTracksAndProfile = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        navigate('/')
        return
      }
      
      setContentOpacity(0)
      setLoadingScreenOpacity(1)
      setLoading(true)
      setError(null)
      setUserProfileImageUrl(null) // Reset on new fetch
      
      const token = await getValidAccessToken()

      if (!token) {
        setError('Authentication session ended. Please log in again.')
        setLoading(false)
        setContentOpacity(1)
        return
      }

      try {
        // Fetch Top Tracks
        const tracksResponse = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=10', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (!tracksResponse.ok) {
          const errorData = await tracksResponse.json()
          if (tracksResponse.status === 401) {
            setError('Your Spotify session has expired or changed. Please log in again.')
            clearTokens()
          } else {
            setError(errorData.error?.message || 'Failed to fetch top tracks from Spotify.')
          }
          setLoading(false)
          setContentOpacity(1)
          return
        }
        const tracksData = await tracksResponse.json()
        setTopTracks(tracksData.items)

        // Fetch User Profile
        const profileResponse = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!profileResponse.ok) {
          // Non-critical error, we can proceed without profile pic
          console.warn('Failed to fetch user profile') 
        } else {
          const profileData = await profileResponse.json()
          if (profileData.images && profileData.images.length > 0) {
            // Prefer larger images if available, otherwise take the first one
            const sortedImages = profileData.images.sort((a, b) => b.width - a.width);
            setUserProfileImageUrl(sortedImages[0].url)
          } else {
            console.warn('User profile has no images.')
          }
        }
        
        setTimeout(() => {
          setLoadingScreenOpacity(0)
          setTimeout(() => {
            setLoading(false)
            setContentOpacity(1)
            setIsInitialLoadTransitionDone(true)
          }, FADE_DURATION)
        }, 3000)

      } catch (err) {
        console.error('Error fetching top tracks:', err.message)
        if (!error) {
          setError(err.message || 'A network or unexpected error occurred.')
        }
        setLoadingScreenOpacity(0)
        setLoading(false)
        setContentOpacity(1)
      }
    }

    fetchTracksAndProfile()
  }, [isAuthenticated, getValidAccessToken, clearTokens, navigate])

  const centralNodePosition = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const mindMapElements = useMemo(() => generateMindMapElements(topTracks, centralNodePosition, userProfileImageUrl), [topTracks, centralNodePosition, userProfileImageUrl])
  const songNodes = useMemo(() => filterElementsByType(mindMapElements, 'node'), [mindMapElements])
  const branches = useMemo(() => filterElementsByType(mindMapElements, 'branch'), [mindMapElements])

  // Category-specific SVG generator
  const getCategorySVG = (category) => {
    const svgProps = { width: "120", height: "120", viewBox: "0 0 80 80" }
    // Define primary colors
    const yellow = "#fbbf24"; // Main yellow
    const lightYellow = "#fef3c7"; // Lighter yellow/gold
    const white = "#ffffff";

    switch(category) {
      case 'Verdant Canopy':
        return (
          <svg {...svgProps}>
            {/* Tree canopy pattern */}
            <defs>
              <radialGradient id="canopyGradientMain" cx="50%" cy="50%">
                <stop offset="0%" stopColor={lightYellow} />
                <stop offset="100%" stopColor={yellow} />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="25" fill="url(#canopyGradientMain)" opacity="0.5" />
            <circle cx="40" cy="30" r="8" fill={yellow} />
            <circle cx="30" cy="45" r="6" fill={lightYellow} />
            <circle cx="50" cy="45" r="6" fill={lightYellow} />
            <circle cx="35" cy="55" r="5" fill={yellow} opacity="0.7"/>
            <circle cx="45" cy="55" r="5" fill={yellow} opacity="0.7"/>
            <line x1="40" y1="60" x2="40" y2="70" stroke={yellow} strokeWidth="3" />
          </svg>
        )
        
      case 'Deeproot Dweller':
        return (
          <svg {...svgProps}>
            {/* Underground root network */}
            <defs>
              <linearGradient id="rootGradientMain" cx="50%" cy="50%">
                <stop offset="0%" stopColor={yellow} />
                <stop offset="100%" stopColor={lightYellow} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="8" fill="url(#rootGradientMain)" />
            <line x1="40" y1="40" x2="20" y2="60" stroke={yellow} strokeWidth="3" />
            <line x1="40" y1="40" x2="60" y2="60" stroke={yellow} strokeWidth="3" />
            <line x1="40" y1="40" x2="15" y2="35" stroke={lightYellow} strokeWidth="2" />
            <line x1="40" y1="40" x2="65" y2="35" stroke={lightYellow} strokeWidth="2" />
            <circle cx="20" cy="60" r="4" fill={yellow} opacity="0.8"/>
            <circle cx="60" cy="60" r="4" fill={yellow} opacity="0.8"/>
            <circle cx="15" cy="35" r="3" fill={lightYellow} opacity="0.7"/>
            <circle cx="65" cy="35" r="3" fill={lightYellow} opacity="0.7"/>
          </svg>
        )
        
      case 'Aetherial Bloom':
        return (
          <svg {...svgProps}>
            {/* Ethereal flower petals */}
            <defs>
              <radialGradient id="bloomGradientMain" cx="50%" cy="50%">
                <stop offset="0%" stopColor={white} />
                <stop offset="100%" stopColor={lightYellow} />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="6" fill={white} />
            <ellipse cx="40" cy="25" rx="8" ry="12" fill="url(#bloomGradientMain)" opacity="0.8" />
            <ellipse cx="55" cy="40" rx="12" ry="8" fill="url(#bloomGradientMain)" opacity="0.8" />
            <ellipse cx="40" cy="55" rx="8" ry="12" fill="url(#bloomGradientMain)" opacity="0.8" />
            <ellipse cx="25" cy="40" rx="12" ry="8" fill="url(#bloomGradientMain)" opacity="0.8" />
            <circle cx="40" cy="40" r="20" fill="none" stroke={yellow} strokeWidth="1" opacity="0.5" />
          </svg>
        )
        
      case 'Dawning Spire':
        return (
          <svg {...svgProps}>
            {/* Upward pointing spire */}
            <defs>
              <linearGradient id="spireGradientMain" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={yellow} />
                <stop offset="100%" stopColor={white} />
              </linearGradient>
            </defs>
            <polygon points="40,15 50,35 45,35 45,65 35,65 35,35 30,35" fill="url(#spireGradientMain)" />
            <circle cx="40" cy="15" r="4" fill={white} />
            <line x1="25" y1="25" x2="35" y2="30" stroke={lightYellow} strokeWidth="2" />
            <line x1="55" y1="25" x2="45" y2="30" stroke={lightYellow} strokeWidth="2" />
            <line x1="20" y1="40" x2="30" y2="40" stroke={yellow} strokeWidth="2" />
            <line x1="60" y1="40" x2="50" y2="40" stroke={yellow} strokeWidth="2" />
          </svg>
        )
        
      case 'Whispering Bark':
        return (
          <svg {...svgProps}>
            {/* Tree bark texture with small details */}
            <defs>
              <pattern id="barkPatternMain" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill={yellow} opacity="0.7"/>
                <line x1="0" y1="5" x2="10" y2="5" stroke={lightYellow} strokeWidth="1" opacity="0.5"/>
              </pattern>
            </defs>
            <rect x="35" y="20" width="10" height="40" fill="url(#barkPatternMain)" />
            <circle cx="30" cy="25" r="2" fill={lightYellow} />
            <circle cx="50" cy="30" r="2" fill={lightYellow} />
            <circle cx="28" cy="45" r="1.5" fill={white} />
            <circle cx="52" cy="50" r="1.5" fill={white} />
            <line x1="25" y1="35" x2="30" y2="40" stroke={yellow} strokeWidth="1" opacity="0.6"/>
            <line x1="50" y1="40" x2="55" y2="35" stroke={yellow} strokeWidth="1" opacity="0.6"/>
          </svg>
        )
        
      case 'Celestial Echo':
        return (
          <svg {...svgProps}>
            {/* Cosmic spiral pattern */}
            <defs>
              <radialGradient id="cosmicGradientMain" cx="50%" cy="50%">
                <stop offset="0%" stopColor={white} />
                <stop offset="100%" stopColor={yellow} />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="25" fill="none" stroke={yellow} strokeWidth="1" opacity="0.4" />
            <circle cx="40" cy="40" r="15" fill="none" stroke={lightYellow} strokeWidth="1" opacity="0.6" />
            <circle cx="40" cy="40" r="5" fill="url(#cosmicGradientMain)" />
            <circle cx="25" cy="25" r="2" fill={white} />
            <circle cx="55" cy="25" r="2" fill={white} />
            <circle cx="25" cy="55" r="2" fill={white} />
            <circle cx="55" cy="55" r="2" fill={white} />
            <path d="M 40 40 Q 30 30 40 20 Q 50 30 40 40 Q 50 50 40 60 Q 30 50 40 40" fill="none" stroke={yellow} strokeWidth="1.5" />
          </svg>
        )
        
      case 'Blighted Thorn':
        return (
          <svg {...svgProps}>
            {/* Thorny vine pattern */}
            <defs>
              <linearGradient id="thornGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={yellow} />
                <stop offset="100%" stopColor={lightYellow} />
              </linearGradient>
            </defs>
            <path d="M20 20 Q40 35 60 20 Q45 40 60 60 Q40 45 20 60 Q35 40 20 20" fill="none" stroke={yellow} strokeWidth="2" />
            <polygon points="30,25 35,20 30,15" fill="url(#thornGradientMain)" />
            <polygon points="50,35 55,30 50,25" fill="url(#thornGradientMain)" />
            <polygon points="50,45 55,50 50,55" fill="url(#thornGradientMain)" />
            <polygon points="30,55 35,60 30,65" fill="url(#thornGradientMain)" />
            <circle cx="40" cy="40" r="3" fill={white} />
          </svg>
        )
        
      case 'Shadowed Heart':
        return (
          <svg {...svgProps}>
            {/* Heart shape with golden shadows */}
            <defs>
              <radialGradient id="shadowGradientMain" cx="50%" cy="50%">
                <stop offset="0%" stopColor={yellow} />
                <stop offset="100%" stopColor={lightYellow} opacity="0.7" />
              </radialGradient>
            </defs>
            <path d="M40,50 C35,40 25,35 25,45 C25,55 40,65 40,65 C40,65 55,55 55,45 C55,35 45,40 40,50 Z" fill="url(#shadowGradientMain)" />
            <circle cx="35" cy="30" r="8" fill={yellow} opacity="0.5" />
            <circle cx="45" cy="30" r="8" fill={yellow} opacity="0.5" />
            <circle cx="20" cy="40" r="3" fill={white} opacity="0.6" />
            <circle cx="60" cy="40" r="3" fill={white} opacity="0.6" />
          </svg>
        )
        
      case 'Ancient Sap':
        return (
          <svg {...svgProps}>
            {/* Flowing sap pattern */}
            <defs>
              <linearGradient id="sapGradientMain" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={white} />
                <stop offset="100%" stopColor={yellow} />
              </linearGradient>
            </defs>
            <ellipse cx="40" cy="35" rx="15" ry="20" fill="url(#sapGradientMain)" opacity="0.7" />
            <ellipse cx="40" cy="45" rx="12" ry="15" fill={yellow} opacity="0.8" />
            <circle cx="40" cy="50" r="8" fill={lightYellow} />
            <path d="M35 25 Q40 30 45 25 Q40 35 35 30" fill={white} />
            <circle cx="35" cy="55" r="2" fill={yellow} opacity="0.7" />
            <circle cx="45" cy="55" r="2" fill={yellow} opacity="0.7" />
          </svg>
        )
        
      case 'Fading Glyph':
        return (
          <svg {...svgProps}>
            {/* Ancient symbol fading away */}
            <defs>
              <linearGradient id="glyphGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={yellow} opacity="0.8" />
                <stop offset="100%" stopColor={lightYellow} opacity="0.3" />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="20" fill="none" stroke="url(#glyphGradientMain)" strokeWidth="2" strokeDasharray="5,5" />
            <polygon points="40,30 45,40 40,50 35,40" fill={yellow} opacity="0.6" />
            <line x1="25" y1="40" x2="35" y2="40" stroke={lightYellow} strokeWidth="2" opacity="0.5" />
            <line x1="45" y1="40" x2="55" y2="40" stroke={lightYellow} strokeWidth="2" opacity="0.5" />
            <circle cx="30" cy="30" r="1" fill={white} opacity="0.4" />
            <circle cx="50" cy="30" r="1" fill={white} opacity="0.4" />
            <circle cx="30" cy="50" r="1" fill={white} opacity="0.4" />
            <circle cx="50" cy="50" r="1" fill={white} opacity="0.4" />
          </svg>
        )
        
      default:
        // Fallback generic network pattern
        return (
          <svg {...svgProps}>
            <defs>
              <radialGradient id="nodeGradientMain" cx="50%" cy="50%">
                <stop offset="0%" stopColor={white} />
                <stop offset="100%" stopColor={yellow} />
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="8" fill="url(#nodeGradientMain)" />
            <circle cx="40" cy="20" r="6" fill={yellow} />
            <circle cx="60" cy="40" r="6" fill={yellow} />
            <circle cx="40" cy="60" r="6" fill={yellow} />
            <circle cx="20" cy="40" r="6" fill={yellow} />
            <line x1="40" y1="40" x2="40" y2="20" stroke={lightYellow} strokeWidth="1.5" opacity="0.8" />
            <line x1="40" y1="40" x2="60" y2="40" stroke={lightYellow} strokeWidth="1.5" opacity="0.8" />
            <line x1="40" y1="40" x2="40" y2="60" stroke={lightYellow} strokeWidth="1.5" opacity="0.8" />
            <line x1="40" y1="40" x2="20" y2="40" stroke={lightYellow} strokeWidth="1.5" opacity="0.8" />
          </svg>
        )
    }
  }

  // Results Page Component
  if (showResultsPage && analysisResult) {
    // Define a mapping from category to background image
    const categoryBackgrounds = {
      'Verdant Canopy': '/1.png',
      'Deeproot Dweller': '/1.png',
      'Aetherial Bloom': '/1.png',
      'Dawning Spire': '/2.png',
      'Whispering Bark': '/2.png',
      'Celestial Echo': '/2.png',
      'Blighted Thorn': '/3.png',
      'Shadowed Heart': '/3.png',
      'Ancient Sap': '/4.png',
      'Fading Glyph': '/4.png',
      // Fallback image if a category is not mapped
      default: '/dweller.png' 
    }

    const backgroundImage = categoryBackgrounds[analysisResult.determined_category] || categoryBackgrounds.default

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000000',
        color: 'white',
        overflow: 'hidden',
        opacity: contentOpacity,
        transition: `opacity ${FADE_DURATION}ms ease-in-out`
      }}>
        {/* Background Image */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: '100%',
          backgroundPosition: 'bottom',
          backgroundRepeat: 'no-repeat',
          opacity: 1
        }} />
        
        {/* Content Overlay */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px'
        }}>
          {/* Small Network Diagram at Top */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '40px',
            marginBottom: '20px'
          }}>
            {getCategorySVG(analysisResult.determined_category)}
          </div>

          {/* Spacer to push content to bottom */}
          <div style={{ flex: 1 }} />

          {/* Bottom Text Content */}
          <div style={{
            textAlign: 'center',
            paddingBottom: '60px'
          }}>
            {/* Category Name */}
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '600',
              margin: '0 0 30px 0',
              color: '#ffffff',
              letterSpacing: '1px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              {analysisResult.determined_category}
            </h1>

            {/* Description */}
            <div style={{
              maxWidth: '600px',
              margin: '0 auto 40px auto'
            }}>
              <p style={{
                fontSize: '1rem',
                lineHeight: '1.5',
                color: '#ffffff',
                margin: 0,
                fontWeight: '400'
              }}>
                "{analysisResult.category_description}"
              </p>
            </div>

            {/* Back Button */}
            <button
              onClick={handleBackToTree}
              style={{
                padding: '12px 30px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                letterSpacing: '0.5px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)'
                e.target.style.transform = 'translateY(-2px)'
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              Return to the Tree
            </button>
          </div>
        </div>

        {/* Logout button */}
        <button 
          onClick={handleLogout} 
          style={{
            position: 'absolute', 
            top: '20px', 
            left: '20px', 
            zIndex: 10001,
            padding: '8px 15px',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '5px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}
        >
          Logout
        </button>
      </div>
    )
  }

  if (!isAuthenticated && !loading) return null

  if (loading) {
    return (
      <div style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.9)', color: 'white', zIndex: 10000,
        opacity: loadingScreenOpacity,
        transition: `opacity ${FADE_DURATION}ms ease-in-out`
      }}>
        <div 
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'transparent',
            border: '4px solid rgba(255, 223, 150, 0.7)',
            animation: 'pulseGlow 1.8s infinite ease-in-out',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {/* Optional: a smaller, static inner orb or icon if desired */}
          {/* <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(253,224,71,0.5)'}}></div> */}
        </div>
        <p style={{ marginTop: '25px', fontSize: '1.1rem', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.8)'}}>
          Analyzing your sonic identity...
        </p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', zIndex: 10000 
      }}>
        <p>Error: {error}</p>
        <button onClick={() => navigate('/')}>Back to Login</button>
      </div>
    )
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh',
      opacity: contentOpacity,
      transition: `opacity ${FADE_DURATION}ms ease-in-out`
    }}>
      <button 
        onClick={handleLogout} 
        style={{
          position: 'absolute', 
          top: '20px', 
          left: '20px', 
          zIndex: 10001,
          padding: '8px 15px',
          background: 'rgba(255,255,255,0.1)',
          color: 'white',
          border: '1px solid white',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>

      <Canvas camera={{ position: [0, 2, 18], fov: 60 }}>
        <color attach="background" args={['black']} />
        <ambientLight intensity={0.5 * Math.PI} />
        <spotLight 
          position={[10, 15, 10]} angle={0.4} penumbra={0.7} intensity={0.6 * Math.PI}
          castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} decay={1.5} distance={50}
        />
        <directionalLight position={[-10, -5, -10]} intensity={0.2 * Math.PI} />
        
        <Suspense fallback={null}>
          {songNodes.map((nodeProps, index) => {
            let songNodeAppearDelay = 0;
            if (nodeProps.isUserProfile) {
              // User profile node appears with the initial content fade-in
              songNodeAppearDelay = FADE_DURATION; 
            } else if (isInitialLoadTransitionDone) {
              // For other song nodes, calculate delay based on their effective index
              // (subtract 1 if user profile node exists and is first)
              const effectiveIndex = userProfileImageUrl ? index -1 : index;
              if (effectiveIndex >= 0) { // Ensure effectiveIndex is not negative
                 const associatedBranchStartDelay = BRANCH_ANIMATION_START_DELAY + (effectiveIndex * SONG_NODE_STAGGER_DELAY); // Use SONG_NODE_STAGGER_DELAY
                 songNodeAppearDelay = associatedBranchStartDelay + SONG_NODE_ANIMATION_START_OFFSET; 
              }
            } // else, if not initial load transition done and not user profile, delay is 0 (appears immediately)
            
            return (
              <SongNode 
                key={nodeProps.id} 
                {...nodeProps} 
                appearDelay={songNodeAppearDelay}
              />
            );
          })}
          {branches.map((branchProps, index) => {
            // Branch animation delay is tied to the song nodes they connect to.
            // If userProfileImageUrl exists, all branches connect to song nodes from index 1 onwards in the original topTracks array.
            // So the branch index aligns with the song node's effective index for animation timing.
            const effectiveBranchIndex = index; // The branches array is built based on tracks that *have* branches.
                                          // The user profile node doesn't have an incoming branch this way.
            let branchAppearDelay = 0;
            if (isInitialLoadTransitionDone) {
              branchAppearDelay = BRANCH_ANIMATION_START_DELAY + (effectiveBranchIndex * BRANCH_STAGGER_DELAY);
            }

            return (
            <Branch 
              key={branchProps.id} 
              {...branchProps} 
              animationOffset={index * 0.3} // Existing prop for gooey material
              appearDelay={branchAppearDelay} 
            />
            );
          })}
        </Suspense>

        <OrbitControls autoRotate autoRotateSpeed={0.4} enablePan={true} target={[0, 0, 0]} />

        <EffectComposer>
          <Bloom 
            intensity={0.6} 
            luminanceThreshold={0.8}
            luminanceSmoothing={0.2}
            mipmapBlur={true}
            kernelSize={KernelSize.MEDIUM}
          />
        </EffectComposer>
      </Canvas>

      <TracksList 
        topTracks={topTracks} 
        onAnalyzeBranch={handleAnalyzeBranch}
        analyzing={analyzing}
      />
    </div>
  )
}

export default MainAppScreen 
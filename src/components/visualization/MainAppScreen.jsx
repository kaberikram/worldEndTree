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
  const navigate = useNavigate()

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
      
      // Get unique artist IDs
      const artistIds = [...new Set(
        topTracks.flatMap(track => track.artists.map(artist => artist.id))
      )]
      
      // Fetch artist details for genres
      const artistDetails = await fetchArtistDetails(artistIds, token)
      
      // Create artist genres map
      const artistGenresMap = {}
      artistDetails.forEach(artist => {
        artistGenresMap[artist.id] = artist.genres || []
      })
      
      // Enhance tracks with artist genres
      const enhancedTracks = topTracks.map(track => ({
        ...track,
        artists: track.artists.map(artist => ({
          ...artist,
          genres: artistGenresMap[artist.id] || []
        }))
      }))
      
      // Perform genre-based analysis
      const result = analyzeBranch(enhancedTracks)
      setAnalysisResult(result)
      setShowResultsPage(true)
      
    } catch (err) {
      console.error('Error analyzing branch:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleBackToTree = () => {
    setShowResultsPage(false)
    setAnalysisResult(null)
  }

  useEffect(() => {
    const fetchTracks = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        navigate('/')
        return
      }
      
      setLoading(true)
      setError(null)
      
      const token = await getValidAccessToken()

      if (!token) {
        setError('Authentication session ended. Please log in again.')
        setLoading(false)
        return
      }

      try {
        const response = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=10', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          if (response.status === 401) {
            setError('Your Spotify session has expired or changed. Please log in again.')
            clearTokens()
          } else {
            setError(errorData.error?.message || 'Failed to fetch top tracks from Spotify.')
          }
          setLoading(false)
          return
        }
        
        const data = await response.json()
        setTopTracks(data.items)
      } catch (err) {
        console.error('Error fetching top tracks:', err.message)
        if (!error) {
          setError(err.message || 'A network or unexpected error occurred.')
        }
      }
      setLoading(false)
    }

    fetchTracks()
  }, [isAuthenticated, getValidAccessToken, clearTokens, navigate, error])

  const centralNodePosition = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const mindMapElements = useMemo(() => generateMindMapElements(topTracks, centralNodePosition), [topTracks, centralNodePosition])
  const songNodes = useMemo(() => filterElementsByType(mindMapElements, 'node'), [mindMapElements])
  const branches = useMemo(() => filterElementsByType(mindMapElements, 'branch'), [mindMapElements])

  // Results Page Component
  if (showResultsPage && analysisResult) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000000',
        color: 'white',
        overflow: 'hidden'
      }}>
        {/* Background Image */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/dweller.png)',
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
          {/* Track Mind Map */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '40px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              alignItems: 'center'
            }}>
              {topTracks && topTracks.slice(0, 5).map((track, index) => (
                <div
                  key={track.id}
                  style={{
                    padding: '7px 14px',
                    background: 'transparent',
                    borderRadius: '25px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    fontSize: '0.63rem',
                    fontWeight: '500',
                    color: '#fff',
                    textAlign: 'center',
                    minWidth: '140px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                  }}
                >
                  {track.name.length > 25 ? track.name.substring(0, 25) + '...' : track.name}
                </div>
              ))}
            </div>
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
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', zIndex: 10000 
      }}>
        <p>Loading top tracks...</p>
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
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
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
          {songNodes.map(nodeProps => (
            <SongNode key={nodeProps.id} {...nodeProps} />
          ))}
          {branches.map((branchProps, index) => (
            <Branch 
              key={branchProps.id} 
              {...branchProps} 
              animationOffset={index * 0.3}
            />
          ))}
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
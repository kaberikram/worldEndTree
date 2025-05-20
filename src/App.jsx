import { useEffect, useState, useRef, Suspense, useMemo } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import useAuthStore from './store/authStore'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { OrbitControls, useTexture, Billboard, Html, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { KernelSize } from 'postprocessing'

// Gooey, animated blob branch shader
const GooeyBranchMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color('#FFD700'), // Golden yellow base color
    branchLength: 1.0,
    blobCenter: 0.0, // Normalized position (-0.5 to 0.5)
    blobSize: 0.25,   // Width of the blob in normalized units
    blobAmplitudeFactor: 2.8, // Increased for a more obvious physical bulge
    blobOpacityBoost: 0.45, // Increased for a more solid glowing blob
    glowColor: new THREE.Color('#FFEEAA'), // Lighter yellow for glow
    glowIntensity: 2.5, // Significantly increased for a stronger glow
  },
  // Vertex Shader (for mesh deformation)
  `
    uniform float time;
    uniform float branchLength;
    uniform float blobCenter;
    uniform float blobSize;
    uniform float blobAmplitudeFactor;
    varying vec2 vUv;
    varying float vNormalizedY; // Pass normalized Y to fragment shader

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Gooey displacement logic - more intense and sinewave-ish
      float baseAmplitude = 0.022; 
      float endSwellingMax = 0.028; 

      // Calculate normalized position along the cylinder's length (-0.5 to 0.5)
      vNormalizedY = pos.y / branchLength; // Also assign to varying
      
      float swellFactor = 1.0 + smoothstep(0.3, 0.5, abs(vNormalizedY)) * (endSwellingMax / baseAmplitude);
      float currentAmplitude = baseAmplitude * swellFactor;
      
      // Blob effect calculation
      float distToBlob = abs(vNormalizedY - blobCenter);
      float blobWave = smoothstep(blobSize * 0.5, 0.0, distToBlob); // 1 at blob center, 0 outside
      float effectiveAmplitude = currentAmplitude * (1.0 + blobWave * blobAmplitudeFactor);

      vec3 normalTransformed = normalMatrix * normal;
      
      float displacement = sin(time * 2.2 + pos.y * 3.5) * effectiveAmplitude * 1.2;
      displacement += cos(time * 3.8 + pos.x * 7.0) * effectiveAmplitude * 0.5; 

      vec3 displacedPosition = pos + normalTransformed * displacement;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
    }
  `,
  // Fragment Shader (updated for glowing bulge)
  `
    uniform float time;
    uniform vec3 color;
    uniform float blobCenter;
    uniform float blobSize;
    uniform float blobOpacityBoost;
    uniform vec3 glowColor;
    uniform float glowIntensity;
    varying vec2 vUv;
    varying float vNormalizedY; // Receive from vertex shader

    float pseudoNoise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 animatedUv = vUv;
      animatedUv.x += time * 0.03;
      animatedUv.y -= time * 0.05;

      float pattern = sin(animatedUv.y * 10.0 + time * 1.5) * 0.4;
      pattern += cos(animatedUv.x * 8.0 - time * 1.0) * 0.4;
      pattern += pseudoNoise(animatedUv * 5.0 + time * 0.2) * 0.3;
      pattern = (pattern + 1.0) / 2.0; 

      float distFromCenter = distance(vUv, vec2(0.5, 0.5));
      pattern *= (1.0 - distFromCenter * 0.8); 
      
      float alphaThreshold = 0.15; 
      float featherAmount = 0.35;  
      float baseAlpha = smoothstep(alphaThreshold - featherAmount, alphaThreshold + featherAmount, pattern);
      baseAlpha *= 0.5; 
      baseAlpha = clamp(baseAlpha, 0.0, 0.65);

      // Blob effect: opacity boost and glow
      float distToBlobFrag = abs(vNormalizedY - blobCenter);
      float blobEffectFactor = smoothstep(blobSize * 0.5, 0.0, distToBlobFrag); // 1 at blob center, 0 outside
      
      float finalAlpha = baseAlpha + blobEffectFactor * blobOpacityBoost;
      finalAlpha = clamp(finalAlpha, 0.0, 0.95); // Allow blob to be more opaque

      vec3 finalColor = color + glowColor * blobEffectFactor * glowIntensity;

      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `
)
extend({ GooeyBranchMaterial })

// Placeholder for where your Client ID will be accessed
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const redirectUri = 'http://127.0.0.1:5173/callback' // Your registered redirect URI

// Helper function to generate a random string for code_verifier and state
function generateRandomString(length) {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

// Helper function to generate code_challenge
async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function LoginScreen() {
  const handleLogin = async () => {
    const codeVerifier = generateRandomString(128)
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = generateRandomString(16)

    localStorage.setItem('spotify_code_verifier', codeVerifier)
    localStorage.setItem('spotify_auth_state', state)
    console.log('[LoginScreen] Stored spotify_auth_state:', state)
    console.log('[LoginScreen] Stored spotify_code_verifier:', codeVerifier)

    const scope = 'user-top-read' // Request permission to read top tracks

    const args = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    })

    window.location = 'https://accounts.spotify.com/authorize?' + args
  }

  return (
    <div>
      <h1>World End Tree</h1>
      <p>Visualize your Spotify top tracks!</p>
      <button onClick={handleLogin}>Login with Spotify</button>
    </div>
  )
}

function Callback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setTokens } = useAuthStore();
  const processingRef = useRef(false); // Flag to ensure logic runs once
  const [message, setMessage] = useState('Processing login...');

  useEffect(() => {
    if (processingRef.current) return; // If already processed (or processing), bail.

    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const receivedStateFromUrl = params.get('state');
    const error = params.get('error');

    const initialStoredState = localStorage.getItem('spotify_auth_state');
    const initialCodeVerifier = localStorage.getItem('spotify_code_verifier');
    
    console.log('[Callback] useEffect run. processingRef.current:', processingRef.current);
    console.log('[Callback] Received URL state:', receivedStateFromUrl);
    console.log('[Callback] Initial localStorage spotify_auth_state:', initialStoredState);
    console.log('[Callback] Initial localStorage spotify_code_verifier:', initialCodeVerifier);

    // It's critical these are removed *before* the async operation might be re-attempted by StrictMode
    localStorage.removeItem('spotify_code_verifier');
    localStorage.removeItem('spotify_auth_state');

    const exchangeCodeForToken = async (authCode, receivedState, verifier) => {
      // processingRef.current = true; // Set it here - already set before calling
      console.log('[Callback] exchangeCodeForToken: Auth state for comparison - URL:', receivedState, 'Original Stored:', initialStoredState);
      console.log('[Callback] exchangeCodeForToken: Code verifier for use:', verifier);

      if (receivedState !== initialStoredState) {
        console.error('State mismatch. URL state:', receivedState, 'Original stored state:', initialStoredState);
        setMessage('Error: State mismatch. Please try logging in again.');
        // No need to set processingRef.current = false here as we navigate away or it already ran once.
        setTimeout(() => navigate('/'), 3000); 
        return;
      }

      if (!verifier) {
        console.error('Code verifier was not available (null or undefined after initial read)');
        setMessage('Error: Code verifier not found. Please try logging in again.');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      try {
        const bodyParams = new URLSearchParams();
        bodyParams.append('client_id', clientId);
        bodyParams.append('grant_type', 'authorization_code');
        bodyParams.append('code', authCode);
        bodyParams.append('redirect_uri', redirectUri);
        bodyParams.append('code_verifier', verifier);

        const result = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: bodyParams,
        });
        
        const tokens = await result.json();

        if (!result.ok) {
          console.error('Token exchange error:', tokens);
          setMessage(`Login Error: ${tokens.error_description || 'Failed to get token'}. Redirecting...`);
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        setTokens(tokens);
        setMessage('Login successful! Redirecting...');
        navigate('/'); 

      } catch (fetchError) {
        console.error('Error during token exchange:', fetchError);
        setMessage('An unexpected error occurred. Please try again. Redirecting...');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    if (error) {
      console.error('Spotify auth error:', error);
      setMessage(`Login failed: ${error}. Please try again. Redirecting...`);
      if (!processingRef.current) { // Only set if not already processed
         processingRef.current = true; // Mark as processed even on error to prevent re-run
         setTimeout(() => navigate('/'), 3000);
      }
    } else if (code && receivedStateFromUrl) {
      if (!processingRef.current) {
        processingRef.current = true; // Mark that we are starting the process.
        exchangeCodeForToken(code, receivedStateFromUrl, initialCodeVerifier);
      }
    } else {
      console.warn('Invalid callback. Missing code or state.');
      if (!processingRef.current) {
        processingRef.current = true;
        setMessage('Invalid callback. Redirecting to login...');
        setTimeout(() => navigate('/'), 1000);
      }
    }
  // Simplify dependencies: location.search is the primary trigger for new callback data.
  // navigate and setTokens are stable functions from hooks.
  }, [navigate, setTokens, location.search]); 

  return <div>{message}</div>;
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const clearTokens = useAuthStore((state) => state.clearTokens)

  const handleLogout = () => {
    clearTokens()
  }

  return (
    <>
      <nav>
        {isAuthenticated && <button onClick={handleLogout}>Logout</button>}
      </nav>
      <Routes>
        <Route path="/callback" element={<Callback />} />
        <Route path="/" element={isAuthenticated ? <MainAppScreen /> : <LoginScreen />} />
        {/* Add other routes here */}
      </Routes>
    </>
  )
}

// Placeholder for the main application screen after login
function MainAppScreen() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [topTracks, setTopTracks] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTopTracks = async () => {
      if (!accessToken) return
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=10', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message || 'Failed to fetch top tracks')
        }
        const data = await response.json()
        setTopTracks(data.items)
      } catch (err) {
        console.error('Error fetching top tracks:', err)
        setError(err.message)
      }
      setLoading(false)
    }

    fetchTopTracks()
  }, [accessToken])

  // ---- Start: Logic moved from TreeVisualization.jsx for mindMapElements ----
  const centralNodePosition = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const mindMapElements = useMemo(() => {
    if (!topTracks) return [];
    const elements = [];
    let firstNodePositionArray = [0,0,0];

    topTracks.forEach((track, index) => {
      const rank = index + 1;
      const albumArtUrl = track.album?.images?.[0]?.url;
      let nodePositionVec = new THREE.Vector3();
      let branchStartPointVec = new THREE.Vector3().copy(centralNodePosition);

      if (rank === 1) {
        nodePositionVec.copy(centralNodePosition);
        firstNodePositionArray = nodePositionVec.toArray();
      } else {
        const angle = ( (index -1) / (topTracks.length -1) ) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
        const yAngle = (Math.random() - 0.5) * Math.PI * 0.4;
        const baseRadius = 4;
        const radiusIncrement = 0.7;
        const radius = baseRadius + (rank - 2) * radiusIncrement * (1 + (Math.random() - 0.5) * 0.6);
        
        nodePositionVec.set(
          radius * Math.cos(angle) * Math.cos(yAngle),
          radius * Math.sin(yAngle),
          radius * Math.sin(angle) * Math.cos(yAngle)
        );
        nodePositionVec.add(centralNodePosition);
        branchStartPointVec.fromArray(firstNodePositionArray);
      }

      elements.push({
        type: 'node',
        id: track.id,
        position: nodePositionVec.toArray(),
        trackName: track.name,
        albumArtUrl: albumArtUrl,
        rank: rank,
      });

      if (rank > 1) {
        elements.push({
          type: 'branch',
          id: `branch-${track.id}`,
          startPoint: branchStartPointVec.toArray(),
          endPoint: nodePositionVec.toArray(),
        });
      }
    });
    return elements;
  }, [topTracks, centralNodePosition]);

  const songNodes = mindMapElements.filter(el => el.type === 'node');
  const branches = mindMapElements.filter(el => el.type === 'branch');
  // ---- End: Logic moved from TreeVisualization.jsx ----

  if (!isAuthenticated) return null; // Should be handled by router, but as a safeguard

  // If loading, show a full-screen loading message (could be styled better later)
  if (loading) return <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', zIndex: 10000 }}><p>Loading top tracks...</p></div>;
  
  // If error, show a full-screen error (could be styled better)
  if (error) return <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', zIndex: 10000 }}><p>Error: {error}</p><button onClick={() => window.location.reload()}>Try Again</button></div>;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 2, 18], fov: 60 }} style={{ background: 'black' }}>
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
              animationOffset={index * 0.3} // Stagger animation start
            />
          ))}
        </Suspense>

        <OrbitControls autoRotate autoRotateSpeed={0.4} enablePan={true} target={[0, 0, 0]} />

        {/* Post-processing effects */}
        <EffectComposer>
          <Bloom 
            intensity={0.6} 
            luminanceThreshold={0.8} // Only bloom on very bright parts
            luminanceSmoothing={0.2}
            mipmapBlur={true} // Better performance
            kernelSize={KernelSize.MEDIUM} // Performance-conscious kernel size
          />
          {/* Other effects can be added here */}
        </EffectComposer>

      </Canvas>

      {/* Fixed 2D UI for Top Tracks List */}
      {topTracks && (
        <div 
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '30px',
            width: 'calc(100% - 60px)',
            maxWidth: '175px',
            maxHeight: '175px',
            overflowY: 'auto',
            background: 'rgba(255, 255, 255, 0.85)',
            padding: '12px', // Reduced from 15px
            borderRadius: '12px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
            zIndex: 10, // Ensure it's above the canvas
            fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            color: '#333',
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
            opacity: 1,
          }}
          className="tracks-overlay"
        >
          <h3 style={{ marginTop: 0, marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '6px', fontSize: '1em' }}>Your Top Tracks</h3>
          <ol className="track-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {topTracks.map((track) => (
              <li key={track.id} className="track-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                {track.album && track.album.images && track.album.images.length > 0 && (
                  <img 
                    src={track.album.images[0].url} 
                    alt={track.name} 
                    style={{ width: '40px', height: '40px', marginRight: '10px', borderRadius: '6px', objectFit: 'cover' }}
                  />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: '600', fontSize: '0.85em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</span>
                  <span style={{ fontSize: '0.7em', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {track.artists.map(artist => artist.name).join(', ')}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ---- Start: Components moved from TreeVisualization.jsx ----

function SongNode(props) {
  const { position, albumArtUrl, trackName, id: spotifyId, rank, ...rest } = props;

  const meshRef = useRef();
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);

  const texture = albumArtUrl ? useTexture(albumArtUrl) : null;

  const planeSize = 2.2;

  return (
    <Billboard position={position} {...rest}>
      <mesh
        ref={meshRef}
        renderOrder={1}
        scale={clicked ? 1.25 : 1}
        onClick={(event) => {
          event.stopPropagation();
          click(!clicked);
          if (trackName) {
            console.log('Clicked track:', trackName, 'at position:', position, 'Spotify ID:', spotifyId, 'Rank:', rank);
          }
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          hover(true);
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
  );
}

function Branch({ startPoint, endPoint, animationOffset = 0 }) {
  const branchRef = useRef();
  const materialRef = useRef();

  const { position, quaternion, length } = useMemo(() => {
    const start = new THREE.Vector3(...startPoint);
    const end = new THREE.Vector3(...endPoint);
    const dir = end.clone().sub(start);
    const len = dir.length();
    if (len === 0) return { position: [0,0,0], quaternion: new THREE.Quaternion(), length: 0 };
    dir.normalize();
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const quat = new THREE.Quaternion();
    const cylinderUp = new THREE.Vector3(0, 1, 0);
    quat.setFromUnitVectors(cylinderUp, dir);
    
    return { position: [mid.x, mid.y, mid.z], quaternion: quat, length: len };
  }, [startPoint, endPoint]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.branchLength.value = length;
    }
  }, [length]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.time = clock.getElapsedTime(); // General time for other shader effects
      
      // Calculate effective time for this branch's blob animation, considering the offset
      const effectiveAnimationTime = Math.max(0, clock.getElapsedTime() - animationOffset);
      
      // Animate blobCenter: loop from -0.5 to 0.5 along the branch
      const speed = 0.2; // Controls speed of blob movement (normalized units per second)
      materialRef.current.uniforms.blobCenter.value = (effectiveAnimationTime * speed) % 1.0 - 0.5;
    }
  });

  if (length < 0.01) return null;

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
  );
}

// ---- End: Components moved from TreeVisualization.jsx ----

export default App

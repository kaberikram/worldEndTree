import { useEffect, useState, useRef } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import useAuthStore from './store/authStore'

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
        // Fetch top tracks (e.g., top 10, medium_term)
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
        // Potentially clear tokens if auth error (e.g., 401 Unauthorized)
        // if (err.status === 401) useAuthStore.getState().clearTokens()
      }
      setLoading(false)
    }

    fetchTopTracks()
  }, [accessToken])

  if (!isAuthenticated) return null // Should be handled by router, but as a safeguard

  return (
    <div>
      <h1>Welcome to the Main App!</h1>
      <p>Your 3D Tree will be here, based on your top tracks.</p>
      <h2>Your Top 10 Tracks (Medium Term):</h2>
      {loading && <p>Loading top tracks...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {topTracks && (
        <ol>
          {topTracks.map((track) => (
            <li key={track.id}>
              {track.album && track.album.images && track.album.images.length > 0 && (
                <img 
                  src={track.album.images[0].url} 
                  alt={`Album art for ${track.album.name}`} 
                  style={{ width: '50px', height: '50px', marginRight: '10px' }} 
                />
              )}
              {track.name} by {track.artists.map(artist => artist.name).join(', ')}
            </li>
          ))}
        </ol>
      )}
      {!loading && !topTracks && !error && <p>No top tracks found or could not load.</p>}
    </div>
  )
}

export default App

// Spotify authentication utilities

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID

// Dynamic redirect URI for both development and production
const redirectUri = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:5174/callback'
  : `${window.location.origin}/callback`

// Helper function to generate a random string for code_verifier and state
export function generateRandomString(length) {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

// Helper function to generate code_challenge
export async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Initiate Spotify login flow
export async function initiateSpotifyLogin() {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(16);
  
  localStorage.setItem('spotify_code_verifier', codeVerifier);
  localStorage.setItem('spotify_auth_state', state);
  
  const scope = 'user-top-read user-read-playback-state user-read-recently-played';
  const args = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scope,
    redirect_uri: redirectUri,
    state: state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    show_dialog: 'false',
  });
  
  window.location = 'https://accounts.spotify.com/authorize?' + args;
}

// Exchange authorization code for tokens
export async function exchangeCodeForToken(authCode, receivedState) {
  const initialStoredState = localStorage.getItem('spotify_auth_state');
  const initialCodeVerifier = localStorage.getItem('spotify_code_verifier');
  
  localStorage.removeItem('spotify_code_verifier');
  localStorage.removeItem('spotify_auth_state');

  if (receivedState !== initialStoredState) {
    throw new Error('State mismatch. Please try logging in again.');
  }
  
  if (!initialCodeVerifier) {
    throw new Error('Code verifier not found. Please try logging in again.');
  }

  const bodyParams = new URLSearchParams();
  bodyParams.append('client_id', clientId);
  bodyParams.append('grant_type', 'authorization_code');
  bodyParams.append('code', authCode);
  bodyParams.append('redirect_uri', redirectUri);
  bodyParams.append('code_verifier', initialCodeVerifier);

  const result = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyParams,
  });

  const tokens = await result.json();
  
  if (!result.ok) {
    throw new Error(tokens.error_description || 'Failed to get token');
  }

  return tokens;
}

export { clientId, redirectUri }; 
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      expiresIn: null, // Store when the token expires
      tokenTimestamp: null, // When the token was obtained
      isAuthenticated: false,

      setTokens: (tokens) => {
        const now = Date.now();
        set({
          accessToken: tokens.access_token,
          // Ensure refresh token is persisted, especially if Spotify sends a new one
          refreshToken: tokens.refresh_token || get().refreshToken, 
          expiresIn: tokens.expires_in, // Spotify provides expires_in in seconds
          tokenTimestamp: now,
          isAuthenticated: true,
        });
      },

      clearTokens: () => {
        set({
          accessToken: null,
          refreshToken: null,
          expiresIn: null,
          tokenTimestamp: null,
          isAuthenticated: false,
        });
      },

      isTokenExpired: () => {
        const state = get();
        if (!state.accessToken || !state.tokenTimestamp || !state.expiresIn) {
          return true;
        }
        const now = Date.now();
        // expiresIn is in seconds, tokenTimestamp is in milliseconds
        const expirationTime = state.tokenTimestamp + (state.expiresIn * 1000);
        // Consider token expired if it will expire within the next 60 seconds
        return now >= (expirationTime - 60000); 
      },

      refreshAccessToken: async () => {
        const state = get();
        if (!state.refreshToken) {
          console.warn('No refresh token available to refresh access token.');
          get().clearTokens(); // No way to recover, clear all tokens
          return false;
        }

        try {
          const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
          if (!clientId) {
            console.error("VITE_SPOTIFY_CLIENT_ID is not defined. Cannot refresh token.");
            get().clearTokens();
            return false;
          }
          
          const params = new URLSearchParams();
          params.append('grant_type', 'refresh_token');
          params.append('refresh_token', state.refreshToken);
          params.append('client_id', clientId);

          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
          });

          const tokens = await response.json();

          if (!response.ok) {
            // If refresh fails (e.g., refresh token revoked), clear tokens
            console.error('Failed to refresh token:', tokens.error_description || 'Unknown error');
            get().clearTokens();
            return false;
          }
          
          // Spotify may or may not return a new refresh_token.
          // If it does, use it. Otherwise, keep the existing one.
          get().setTokens({ 
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || state.refreshToken, // IMPORTANT
            expires_in: tokens.expires_in
          });
          console.log('Access token refreshed successfully.');
          return true;
        } catch (error) {
          console.error('Error during token refresh:', error);
          get().clearTokens();
          return false;
        }
      },

      getValidAccessToken: async () => {
        const state = get();
        if (!state.accessToken || state.isTokenExpired()) {
          console.log('Access token is expired or missing, attempting refresh...');
          const refreshSuccess = await state.refreshAccessToken();
          if (!refreshSuccess) {
            console.log('Token refresh failed. User needs to re-authenticate.');
            return null; // Indicate that a valid token could not be obtained
          }
          // After successful refresh, the accessToken in the store is updated
          return get().accessToken;
        }
        return state.accessToken;
      },
    }),
    {
      name: 'spotify-auth-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), 
    }
  )
);

export default useAuthStore; 
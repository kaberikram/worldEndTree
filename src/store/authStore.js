import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      expiresIn: null, // Store when the token expires
      isAuthenticated: false,
      // You can add user profile info here later
      // userProfile: null,

      setTokens: (tokens) => {
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || get().refreshToken, // Keep old refresh token if new one isn't provided
          expiresIn: tokens.expires_in, // Spotify provides expires_in in seconds
          isAuthenticated: true,
        });
        // TODO: You might want to set a timer to refresh the token before it expires
      },

      clearTokens: () => {
        set({
          accessToken: null,
          refreshToken: null,
          expiresIn: null,
          isAuthenticated: false,
          // userProfile: null,
        });
      },
      
      // Example: Action to get user profile (add later)
      // fetchUserProfile: async () => {
      //   const token = get().accessToken;
      //   if (!token) return;
      //   try {
      //     const response = await fetch('https://api.spotify.com/v1/me', {
      //       headers: { Authorization: `Bearer ${token}` },
      //     });
      //     if (!response.ok) throw new Error('Failed to fetch user profile');
      //     const data = await response.json();
      //     set({ userProfile: data });
      //   } catch (error) {
      //     console.error('Error fetching user profile:', error);
      //     // Potentially clear tokens if auth error
      //   }
      // },
    }),
    {
      name: 'spotify-auth-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
      // Optionally, only persist certain parts of the store:
      // partialize: (state) => ({ 
      //   accessToken: state.accessToken, 
      //   refreshToken: state.refreshToken,
      //   expiresIn: state.expiresIn,
      //   isAuthenticated: state.isAuthenticated 
      // }),
    }
  )
);

export default useAuthStore; 
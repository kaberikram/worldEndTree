import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { initiateSpotifyLogin } from '../../utils/spotifyAuth'
import LoginTreeLogo from './LoginTreeLogo'

function LoginScreen() {
  const navigate = useNavigate()
  const { isAuthenticated, getValidAccessToken } = useAuthStore()

  const handleLoginOrAnalyze = async () => {
    if (isAuthenticated) {
      const token = await getValidAccessToken()
      if (token) {
        navigate('/analyze')
        return
      }
    }
    
    initiateSpotifyLogin()
  }

  return (
    <div className="login-screen-container">
      <LoginTreeLogo />
      <h1>World End Tree.</h1>
      <p>From the roots of your taste to every branch of your listening. World End Tree reveals your sonic identity.</p>
      <button onClick={handleLoginOrAnalyze} className="login-screen-button">
        Connect Spotify
      </button>
    </div>
  )
}

export default LoginScreen 
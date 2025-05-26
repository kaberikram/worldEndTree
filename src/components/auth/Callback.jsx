import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { exchangeCodeForToken } from '../../utils/spotifyAuth'
import { playSuccess, playError } from '../../utils/sfx'

function Callback() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setTokens, clearTokens } = useAuthStore()
  const processingRef = useRef(false)
  const [message, setMessage] = useState('Processing login...')

  useEffect(() => {
    if (processingRef.current) return

    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    const receivedStateFromUrl = params.get('state')
    const error = params.get('error')

    const handleAuthCallback = async (authCode, receivedState) => {
      try {
        const tokens = await exchangeCodeForToken(authCode, receivedState)
        setTokens(tokens)
        setMessage('Login successful! Redirecting to analysis...')
        playSuccess();
        navigate('/analyze')
      } catch (error) {
        setMessage(`Login Error: ${error.message}. Redirecting...`)
        playError();
        clearTokens()
        setTimeout(() => navigate('/'), 3000)
      }
    }

    if (error) {
      setMessage(`Login failed: ${error}. Please try again. Redirecting...`)
      playError();
      if (!processingRef.current) {
        processingRef.current = true
        clearTokens()
        setTimeout(() => navigate('/'), 3000)
      }
    } else if (code && receivedStateFromUrl) {
      if (!processingRef.current) {
        processingRef.current = true
        handleAuthCallback(code, receivedStateFromUrl)
      }
    } else {
      if (!processingRef.current) {
        processingRef.current = true
        setMessage('Invalid callback. Redirecting to login...')
        playError();
        clearTokens()
        setTimeout(() => navigate('/'), 1000)
      }
    }
  }, [navigate, setTokens, clearTokens, location.search])

  return <div>{message}</div>
}

export default Callback 
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import useAuthStore from './store/authStore'
import LoginScreen from './components/auth/LoginScreen'
import Callback from './components/auth/Callback'
import MainAppScreen from './components/visualization/MainAppScreen'
import SVGTestPage from './components/visualization/SVGTestPage'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <Routes>
      <Route path="/callback" element={<Callback />} />
      <Route path="/" element={<LoginScreen />} />
      <Route path="/svg-test" element={<SVGTestPage />} />
      <Route 
        path="/analyze" 
        element={isAuthenticated ? <MainAppScreen /> : <Navigate to="/" replace />}
      />
    </Routes>
  )
}

export default App

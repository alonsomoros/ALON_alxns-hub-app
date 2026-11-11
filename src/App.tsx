import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { SplashScreen } from './components/layout/SplashScreen'

const splashDurationMs = 700

function App() {
  const [isReady, setIsReady] = useState(false)
  useEffect(() => { const timer = window.setTimeout(() => setIsReady(true), splashDurationMs); return () => window.clearTimeout(timer) }, [])
  return isReady ? <Dashboard /> : <SplashScreen />
}

export default App

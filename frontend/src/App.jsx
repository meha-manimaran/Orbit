import { useState, useEffect } from 'react'
import IndexPage from './pages/index.jsx'

export default function App() {
  const [backendReady, setBackendReady] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const bannerTimer = setTimeout(() => setShowBanner(true), 2000)

    fetch(`${import.meta.env.VITE_API_URL}/health`)
      .then(() => {
        clearTimeout(bannerTimer)
        setBackendReady(true)
        setShowBanner(false)
      })
      .catch(() => {
        clearTimeout(bannerTimer)
        setShowBanner(true)
      })

    return () => clearTimeout(bannerTimer)
  }, [])

  return (
    <div className="min-h-screen bg-orbit-secondary">
      {showBanner && !backendReady && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orbit-surface border-b border-orbit-border px-6 py-3 flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-orbit-primary border-t-transparent animate-spin flex-shrink-0" />
          <span className="text-orbit-muted text-sm">Warming up the simulation engine...</span>
        </div>
      )}
      <div className={showBanner && !backendReady ? 'pt-11' : ''}>
        <IndexPage backendReady={backendReady} />
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import IndexPage from './pages/index.jsx'
import { checkBackendHealth } from './lib/api.js'

export default function App() {
  const [backendReady, setBackendReady] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const bannerTimer = setTimeout(() => setShowBanner(true), 2000)

    checkBackendHealth()
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
    <div className="min-h-screen bg-[#EFE9DF]">
      {showBanner && !backendReady && (
        <div className="fixed left-0 right-0 top-0 z-50 flex items-center gap-3 border-b border-[#D9D0C5] bg-[#F7F2EB] px-6 py-3">
          <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-[#E8A87C] border-t-transparent" />
          <span className="text-sm text-[#6D655D]">Warming up the simulation engine...</span>
        </div>
      )}
      <div className={showBanner && !backendReady ? 'pt-11' : ''}>
        <IndexPage backendReady={backendReady} />
      </div>
    </div>
  )
}

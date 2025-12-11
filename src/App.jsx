import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import VideoLibrary from './pages/VideoLibrary'
import VideoDetail from './pages/VideoDetail'
import SearchResults from './pages/SearchResults'
import { useStore } from './store/useStore'
import ProcessingIndicator from './components/ProcessingIndicator'

function App() {
  const { initializeDB, isProcessing } = useStore()

  useEffect(() => {
    initializeDB()
  }, [initializeDB])

  return (
    <div className="min-h-screen bg-charcoal-950 relative">
      <div className="bg-shapes" />
      <div className="relative z-10">
        <Header />
        <main className="pt-20">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<VideoLibrary />} />
            <Route path="/video/:videoId" element={<VideoDetail />} />
            <Route path="/search" element={<SearchResults />} />
          </Routes>
        </main>
        {isProcessing && <ProcessingIndicator />}
      </div>
    </div>
  )
}

export default App


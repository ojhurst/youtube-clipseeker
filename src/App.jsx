import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import VideoLibrary from './pages/VideoLibrary'
import VideoDetail from './pages/VideoDetail'
import SearchResults from './pages/SearchResults'
import Changelog from './pages/Changelog'
import { useStore } from './store/useStore'
import ProcessingIndicator from './components/ProcessingIndicator'

function App() {
  const { initializeDB, isProcessing } = useStore()
  const location = useLocation()

  useEffect(() => {
    initializeDB()
  }, [initializeDB])

  // Don't show header/footer on changelog page (it has its own layout)
  const isChangelogPage = location.pathname === '/changelog'

  return (
    <div className="min-h-screen bg-charcoal-950 relative flex flex-col">
      <div className="bg-shapes" />
      <div className="relative z-10 flex flex-col flex-1">
        {!isChangelogPage && <Header />}
        <main className={`flex-1 ${!isChangelogPage ? 'pt-14 sm:pt-16' : ''}`}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<VideoLibrary />} />
            <Route path="/video/:videoId" element={<VideoDetail />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/changelog" element={<Changelog />} />
          </Routes>
        </main>
        {!isChangelogPage && <Footer />}
        {isProcessing && <ProcessingIndicator />}
      </div>
    </div>
  )
}

export default App

import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { parseYouTubeUrl } from '../services/youtubeUtils'
import { processVideo } from '../services/transcriptService'
import VideoCard from '../components/VideoCard'
import StatsDisplay from '../components/StatsDisplay'

// Rate limit: 5 minutes between videos
const RATE_LIMIT_MS = 5 * 60 * 1000
const RATE_LIMIT_KEY = 'clipseeker_last_add'

export default function HomePage() {
  const navigate = useNavigate()
  const { 
    addVideo, 
    addFailedVideo,
    setProcessing, 
    updateProgress,
    videos,
    deleteVideo,
    failedVideos,
    clearFailedVideo,
    getStats,
    hasLocalDataToMigrate,
    localDataCount,
    isMigrating,
    migrateLocalToSupabase
  } = useStore()

  const [url, setUrl] = useState('')
  const [parsedUrl, setParsedUrl] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showAllVideos, setShowAllVideos] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  const stats = getStats()

  // Check rate limit on mount and update countdown
  useEffect(() => {
    const checkCooldown = () => {
      const lastAdd = localStorage.getItem(RATE_LIMIT_KEY)
      if (lastAdd) {
        const elapsed = Date.now() - parseInt(lastAdd, 10)
        const remaining = Math.max(0, RATE_LIMIT_MS - elapsed)
        setCooldownRemaining(remaining)
      } else {
        setCooldownRemaining(0)
      }
    }

    checkCooldown()
    const interval = setInterval(checkCooldown, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatCooldown = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleUrlChange = useCallback((e) => {
    const value = e.target.value
    setUrl(value)
    setError('')
    setSuccessMessage('')

    if (!value.trim()) {
      setParsedUrl(null)
      return
    }

    const parsed = parseYouTubeUrl(value)
    
    // Only accept video URLs
    if (parsed?.type === 'video') {
      setParsedUrl(parsed)
    } else if (parsed?.type === 'channel') {
      setError('Channel imports are disabled. Please paste a single video URL.')
      setParsedUrl(null)
    } else {
      setParsedUrl(null)
    }
  }, [])

  const processSingleVideo = async () => {
    if (!parsedUrl?.videoId) return

    // Check rate limit
    if (cooldownRemaining > 0) {
      setError(`Please wait ${formatCooldown(cooldownRemaining)} before adding another video`)
      return
    }

    // Check if video already exists
    if (videos.some(v => v.id === parsedUrl.videoId)) {
      setError('This video is already in your library!')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      setProcessing(true, { 
        current: 1, 
        total: 1, 
        currentTitle: 'Fetching video...', 
        currentId: parsedUrl.videoId,
        phase: 'processing'
      })
      
      const video = await processVideo(parsedUrl.videoId, (status) => {
        updateProgress({ currentTitle: status, currentId: parsedUrl.videoId })
      })

      await addVideo(video)
      
      // Set rate limit timestamp
      localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString())
      
      setSuccessMessage(`Added "${video.title}"! You can add another video in 5 minutes.`)
      setUrl('')
      setParsedUrl(null)

      navigate(`/video/${video.id}`)
    } catch (err) {
      setError(err.message || 'Failed to process video')
      await addFailedVideo({
        id: parsedUrl.videoId,
        error: err.message,
        addedAt: Date.now()
      })
    } finally {
      setIsLoading(false)
      setProcessing(false)
    }
  }

  const handleMigration = async () => {
    const result = await migrateLocalToSupabase()
    if (result.success) {
      setSuccessMessage(`Successfully migrated ${result.videosCount} videos and ${result.channelsCount} channels to Supabase!`)
    } else {
      setError(`Migration failed: ${result.error}`)
    }
  }

  const retryFailedVideo = async (failedVideo) => {
    // Check rate limit
    if (cooldownRemaining > 0) {
      setError(`Please wait ${formatCooldown(cooldownRemaining)} before retrying`)
      return
    }

    setIsLoading(true)
    try {
      const video = await processVideo(failedVideo.id)
      await addVideo(video)
      await clearFailedVideo(failedVideo.id)
      localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString())
      setSuccessMessage(`Successfully added "${video.title}"!`)
    } catch (err) {
      setError(`Retry failed: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col">
      {/* Migration Banner */}
      {hasLocalDataToMigrate && (
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-blue-500/30">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">
                    Found {localDataCount} videos in local storage
                  </p>
                  <p className="text-sm text-blue-300/80">
                    Migrate to Supabase to access your library from anywhere
                  </p>
                </div>
              </div>
              <button
                onClick={handleMigration}
                disabled={isMigrating}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-xl text-white font-medium flex items-center gap-2 transition-colors"
              >
                {isMigrating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Migrating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Migrate to Cloud
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Find the <span className="text-yt-red">exact moment</span>
            <br />in your videos
          </h1>
          <p className="text-lg text-charcoal-400 max-w-xl mx-auto">
            Search across YouTube video transcripts instantly. Add a video URL and find exactly what you're looking for.
          </p>
        </div>

        {/* URL Input */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              placeholder="Paste a YouTube video URL..."
              className="w-full bg-charcoal-900 border-2 border-charcoal-700 rounded-2xl py-4 px-6 text-lg text-white placeholder-charcoal-500 focus:outline-none focus:border-yt-red/50 transition-all"
              disabled={isLoading}
            />
            {url && !isLoading && (
              <button
                onClick={() => { setUrl(''); setParsedUrl(null); setError(''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Video Detected */}
          {parsedUrl?.type === 'video' && (
            <div className="mt-4 animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-charcoal-400 mb-4">
                <svg className="w-5 h-5 text-yt-red" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span>Video detected</span>
              </div>

              <button
                onClick={processSingleVideo}
                disabled={isLoading || cooldownRemaining > 0}
                className="btn-primary px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : cooldownRemaining > 0 ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Wait {formatCooldown(cooldownRemaining)}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Video</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Cooldown Notice */}
          {cooldownRemaining > 0 && !parsedUrl && (
            <div className="mt-4 p-4 bg-charcoal-800/50 border border-charcoal-700 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-charcoal-400">
                  You can add another video in <span className="text-white font-mono">{formatCooldown(cooldownRemaining)}</span>
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl animate-fade-in">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-300 text-sm">{successMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <StatsDisplay stats={stats} />
      </section>

      {/* Videos Section */}
      {videos.length > 0 && (
        <section className="px-4 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold text-white">
                {showAllVideos ? 'All Videos' : 'Recently Added'}
                <span className="ml-2 text-sm font-normal text-charcoal-500">
                  ({videos.length})
                </span>
              </h2>
              <div className="flex items-center gap-3">
                {videos.length > 16 && (
                  <button
                    onClick={() => setShowAllVideos(!showAllVideos)}
                    className="text-sm text-charcoal-400 hover:text-yt-red flex items-center gap-1 transition-colors"
                  >
                    {showAllVideos ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        Show less
                      </>
                    ) : (
                      <>
                        View all {videos.length}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(showAllVideos ? videos : videos.slice(0, 16)).map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  showDelete={showAllVideos}
                  onDelete={(id) => {
                    if (window.confirm('Delete this video from your library?')) {
                      deleteVideo(id)
                    }
                  }}
                />
              ))}
            </div>
            
            {!showAllVideos && videos.length > 16 && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowAllVideos(true)}
                  className="px-6 py-3 bg-charcoal-800 hover:bg-charcoal-700 rounded-xl text-white font-medium transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Show all {videos.length} videos
                </button>
              </div>
            )}
            
            {showAllVideos && videos.length > 16 && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => {
                    setShowAllVideos(false)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="px-6 py-3 bg-charcoal-800 hover:bg-charcoal-700 rounded-xl text-charcoal-300 font-medium transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Collapse
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Failed Videos Section */}
      {failedVideos.length > 0 && (
        <section className="px-4 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="bg-charcoal-900/50 border border-charcoal-700 rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold text-white mb-4">
                Failed Videos ({failedVideos.length})
              </h3>
              <div className="space-y-3">
                {failedVideos.slice(0, 5).map((failedVideo) => (
                  <div 
                    key={failedVideo.id}
                    className="flex items-center gap-4 p-3 bg-charcoal-800/50 rounded-xl border border-charcoal-700/50"
                  >
                    <div className="w-20 h-12 rounded-lg overflow-hidden bg-charcoal-700 flex-shrink-0">
                      <img 
                        src={`https://img.youtube.com/vi/${failedVideo.id}/mqdefault.jpg`}
                        alt=""
                        className="w-full h-full object-cover opacity-60"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {failedVideo.title || `Video ${failedVideo.id}`}
                      </p>
                      <span className="text-xs text-red-400">
                        {failedVideo.error?.substring(0, 40)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => retryFailedVideo(failedVideo)}
                        disabled={isLoading || cooldownRemaining > 0}
                        className="px-3 py-1.5 bg-charcoal-700 hover:bg-yt-red text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => clearFailedVideo(failedVideo.id)}
                        className="p-1.5 text-charcoal-400 hover:text-red-400 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

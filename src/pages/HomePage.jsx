import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { parseYouTubeUrl } from '../services/youtubeUtils'
import { processVideo, processVideos } from '../services/transcriptService'
import { getRecentChannelVideos, getAllChannelVideos } from '../services/channelService'
import VideoCard from '../components/VideoCard'
import StatsDisplay from '../components/StatsDisplay'

export default function HomePage() {
  const navigate = useNavigate()
  const { 
    addVideo, 
    addChannel, 
    addFailedVideo,
    setProcessing, 
    updateProgress,
    videos,
    deleteVideo,
    failedVideos,
    clearFailedVideo,
    getStats
  } = useStore()

  const [url, setUrl] = useState('')
  const [urlType, setUrlType] = useState(null)
  const [parsedUrl, setParsedUrl] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showAllVideos, setShowAllVideos] = useState(false)
  const [showFailedVideos, setShowFailedVideos] = useState(false)
  const [retryingId, setRetryingId] = useState(null)

  const stats = getStats()

  // Retry a single failed video
  const retryFailedVideo = async (failedVideo) => {
    setRetryingId(failedVideo.id)
    try {
      const video = await processVideo(failedVideo.id)
      video.channelId = failedVideo.channelId
      video.channelName = failedVideo.channelName
      await addVideo(video)
      await clearFailedVideo(failedVideo.id)
      setSuccessMessage(`Successfully added "${video.title}"!`)
    } catch (err) {
      setError(`Retry failed: ${err.message}`)
    } finally {
      setRetryingId(null)
    }
  }

  // Retry all failed videos
  const retryAllFailedVideos = async () => {
    if (failedVideos.length === 0) return
    
    setIsLoading(true)
    setError('')
    setSuccessMessage('')
    
    setProcessing(true, {
      phase: 'processing',
      current: 0,
      total: failedVideos.length,
      currentTitle: 'Retrying failed videos...',
      successCount: 0,
      failCount: 0
    })

    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < failedVideos.length; i++) {
      const failedVideo = failedVideos[i]
      updateProgress({
        current: i + 1,
        total: failedVideos.length,
        currentId: failedVideo.id,
        currentTitle: `Retrying ${failedVideo.title || failedVideo.id}...`,
        successCount,
        failCount
      })

      try {
        const video = await processVideo(failedVideo.id)
        video.channelId = failedVideo.channelId
        video.channelName = failedVideo.channelName
        await addVideo(video)
        await clearFailedVideo(failedVideo.id)
        successCount++
        updateProgress({ successCount })
      } catch (err) {
        failCount++
        updateProgress({ failCount, lastError: err.message })
      }
    }

    setProcessing(false)
    setIsLoading(false)
    
    if (successCount > 0) {
      setSuccessMessage(`Retry complete: ${successCount} videos recovered${failCount > 0 ? `, ${failCount} still failed` : ''}`)
    } else {
      setError(`Retry failed: all ${failCount} videos still have issues`)
    }
  }

  const handleUrlChange = useCallback((e) => {
    const value = e.target.value
    setUrl(value)
    setError('')
    setSuccessMessage('')

    if (!value.trim()) {
      setUrlType(null)
      setParsedUrl(null)
      return
    }

    const parsed = parseYouTubeUrl(value)
    setParsedUrl(parsed)
    setUrlType(parsed?.type || null)
  }, [])

  const processSingleVideo = async () => {
    if (!parsedUrl?.videoId) return

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
      setSuccessMessage(`Added "${video.title}" with ${video.transcript.length} transcript segments`)
      setUrl('')
      setUrlType(null)
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

  const processChannel = async (limit = null) => {
    if (!parsedUrl?.channelIdentifier) return

    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      // Phase 1: Scanning channel for all videos
      setProcessing(true, { 
        phase: 'fetching',
        currentTitle: 'Scanning channel for videos...',
        batch: 1,
        totalBatches: '?',
        total: 0,
        videosScanned: 0
      })

      let channel, videoIds, totalFound

      if (limit) {
        // Quick fetch for "Last X videos"
        const result = await getRecentChannelVideos(parsedUrl.channelIdentifier, parsedUrl.isHandle, limit)
        channel = result.channel
        videoIds = result.videoIds
        totalFound = result.totalFound
      } else {
        // Full channel scan with progress
        const result = await getAllChannelVideos(
          parsedUrl.channelIdentifier, 
          parsedUrl.isHandle,
          (batchProgress) => {
            updateProgress({
              phase: 'fetching',
              batch: batchProgress.batch,
              totalBatches: '?',
              total: batchProgress.videosFound,
              currentTitle: `Found ${batchProgress.videosFound} videos (scanning batch ${batchProgress.batch})...`
            })
          }
        )
        channel = result.channel
        videoIds = result.videoIds
        totalFound = result.totalFound
      }

      await addChannel(channel)

      // Filter out videos already in library
      const existingVideoIds = new Set(videos.map(v => v.id))
      const newVideoIds = videoIds.filter(id => !existingVideoIds.has(id))
      const skippedCount = videoIds.length - newVideoIds.length

      // Show scan complete message
      updateProgress({
        phase: 'fetching',
        currentTitle: `Scan complete! Found ${totalFound} videos total${skippedCount > 0 ? ` (${skippedCount} already in library)` : ''}`,
        total: totalFound
      })

      // Small delay to show the scan complete message
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (newVideoIds.length === 0) {
        setSuccessMessage(`All ${videoIds.length} videos from "${channel.name}" are already in your library!`)
        setUrl('')
        setUrlType(null)
        setParsedUrl(null)
        setIsLoading(false)
        setProcessing(false)
        return
      }

      // Phase 2: Process all videos in batches
      const BATCH_SIZE = 30
      const totalBatches = Math.ceil(newVideoIds.length / BATCH_SIZE)

      updateProgress({ 
        phase: 'processing',
        current: 0, 
        total: newVideoIds.length, 
        currentTitle: `Starting to process ${newVideoIds.length} videos in ${totalBatches} batch${totalBatches > 1 ? 'es' : ''}...`,
        batch: 1,
        totalBatches,
        skippedCount
      })

      let successCount = 0
      let failCount = 0

      // Process all videos
      for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const batchStart = batchNum * BATCH_SIZE
        const batchEnd = Math.min(batchStart + BATCH_SIZE, newVideoIds.length)
        const batchVideoIds = newVideoIds.slice(batchStart, batchEnd)
        
        // Update batch info
        updateProgress({
          batch: batchNum + 1,
          totalBatches,
          currentTitle: `Processing batch ${batchNum + 1} of ${totalBatches}...`
        })

        // Process this batch
        await processVideos(
          batchVideoIds,
          (progress) => {
            const overallCurrent = batchStart + progress.current
            updateProgress({
              phase: 'processing',
              current: overallCurrent,
              total: newVideoIds.length,
              currentId: progress.currentId,
              currentTitle: `Extracting transcript...`,
              batch: batchNum + 1,
              totalBatches,
              successCount,
              failCount
            })
          },
          async (video) => {
            video.channelId = channel.id
            video.channelName = channel.name
            await addVideo(video)
            successCount++
            updateProgress({ successCount })
          },
          async (failed) => {
            await addFailedVideo({
              ...failed,
              channelId: channel.id,
              channelName: channel.name,
              addedAt: Date.now()
            })
            failCount++
            updateProgress({ failCount, lastError: failed.error })
          }
        )

        // Small delay between batches to prevent overwhelming
        if (batchNum < totalBatches - 1) {
          updateProgress({
            currentTitle: `Batch ${batchNum + 1} complete! Starting batch ${batchNum + 2}...`
          })
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // Build success message
      let message = `Added ${successCount} videos from "${channel.name}"`
      if (skippedCount > 0) {
        message += ` (${skippedCount} already in library)`
      }
      if (failCount > 0) {
        message += `, ${failCount} had no transcripts`
      }

      setSuccessMessage(message)
      setUrl('')
      setUrlType(null)
      setParsedUrl(null)

    } catch (err) {
      setError(err.message || 'Failed to process channel')
    } finally {
      setIsLoading(false)
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Find the <span className="text-yt-red">exact moment</span>
            <br />in your videos
          </h1>
          <p className="text-lg text-charcoal-400 max-w-xl mx-auto">
            Search across YouTube video transcripts instantly. Add videos or entire channels and find exactly what you're looking for.
          </p>
        </div>

        {/* URL Input */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              placeholder="Paste a YouTube video or channel URL..."
              className="w-full bg-charcoal-900 border-2 border-charcoal-700 rounded-2xl py-4 px-6 text-lg text-white placeholder-charcoal-500 focus:outline-none focus:border-yt-red/50 transition-all"
              disabled={isLoading}
            />
            {url && !isLoading && (
              <button
                onClick={() => { setUrl(''); setUrlType(null); setParsedUrl(null); setError(''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* URL Type Indicator */}
          {urlType && (
            <div className="mt-4 animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-charcoal-400 mb-4">
                {urlType === 'video' && (
                  <>
                    <svg className="w-5 h-5 text-yt-red" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    <span>Single video detected</span>
                  </>
                )}
                {urlType === 'channel' && (
                  <>
                    <svg className="w-5 h-5 text-yt-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Channel detected: <span className="text-white font-medium">{parsedUrl?.channelIdentifier}</span></span>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {urlType === 'video' && (
                  <button
                    onClick={processSingleVideo}
                    disabled={isLoading}
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
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Add Video</span>
                      </>
                    )}
                  </button>
                )}

                {urlType === 'channel' && (
                  <>
                    <button
                      onClick={() => processChannel(5)}
                      disabled={isLoading}
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
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Last 5 Videos</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => processChannel(null)}
                      disabled={isLoading}
                      className="bg-charcoal-800 hover:bg-charcoal-700 px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Entire Channel</span>
                    </button>
                  </>
                )}
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
                {showAllVideos && (
                  <button
                    onClick={() => navigate('/library')}
                    className="text-sm text-charcoal-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Manage
                  </button>
                )}
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
            
            {/* Show more button at bottom when not expanded */}
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
            
            {/* Collapse button when expanded */}
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
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowFailedVideos(!showFailedVideos)}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-display text-lg font-semibold text-white group-hover:text-yt-red transition-colors">
                      {failedVideos.length} Failed Videos
                    </h3>
                    <p className="text-sm text-charcoal-400">
                      {showFailedVideos ? 'Click to hide' : 'Click to see details & retry options'}
                    </p>
                  </div>
                  <svg className={`w-5 h-5 text-charcoal-400 transition-transform ml-auto ${showFailedVideos ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showFailedVideos && (
                  <button
                    onClick={retryAllFailedVideos}
                    disabled={isLoading}
                    className="px-4 py-2 bg-yt-red hover:bg-red-700 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry All
                  </button>
                )}
              </div>

              {showFailedVideos && (
                <div className="space-y-3 mt-4">
                  {failedVideos.map((failedVideo) => (
                    <div 
                      key={failedVideo.id}
                      className="flex items-center gap-4 p-3 bg-charcoal-800/50 rounded-xl border border-charcoal-700/50"
                    >
                      {/* Thumbnail */}
                      <div className="w-24 h-14 rounded-lg overflow-hidden bg-charcoal-700 flex-shrink-0">
                        <img 
                          src={`https://img.youtube.com/vi/${failedVideo.id}/mqdefault.jpg`}
                          alt=""
                          className="w-full h-full object-cover opacity-60"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {failedVideo.title || `Video ${failedVideo.id}`}
                        </p>
                        {failedVideo.channelName && (
                          <p className="text-xs text-charcoal-400 truncate">
                            {failedVideo.channelName}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                            {failedVideo.error?.includes('IP') ? 'Rate Limited' : 
                             failedVideo.error?.includes('No transcript') ? 'No Transcript' :
                             failedVideo.error?.includes('disabled') ? 'Disabled' :
                             'Failed'}
                          </span>
                          <span className="text-xs text-charcoal-500 truncate max-w-[200px]" title={failedVideo.error}>
                            {failedVideo.error?.substring(0, 50)}...
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={`https://youtube.com/watch?v=${failedVideo.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-charcoal-400 hover:text-white hover:bg-charcoal-700 rounded-lg transition-colors"
                          title="Open in YouTube"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </a>
                        <button
                          onClick={() => retryFailedVideo(failedVideo)}
                          disabled={retryingId === failedVideo.id || isLoading}
                          className="px-3 py-1.5 bg-charcoal-700 hover:bg-yt-red text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          {retryingId === failedVideo.id ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Retrying
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Retry
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => clearFailedVideo(failedVideo.id)}
                          className="p-2 text-charcoal-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Dismiss"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Rate limit warning */}
                  {failedVideos.some(v => v.error?.includes('IP')) && (
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-yellow-300">Rate Limited by YouTube</p>
                          <p className="text-xs text-yellow-400/80 mt-1">
                            YouTube is temporarily blocking requests from your IP. Wait a few minutes and try again, or use a VPN.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

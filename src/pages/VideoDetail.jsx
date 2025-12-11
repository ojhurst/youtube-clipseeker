import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { formatTimestamp, formatDuration } from '../services/youtubeUtils'

export default function VideoDetail() {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { getVideo, searchQuery, highlightedTimestamp, setHighlightedTimestamp } = useStore()

  const video = getVideo(videoId)
  const playerContainerRef = useRef(null)
  const transcriptRef = useRef(null)
  const highlightRef = useRef(null)
  const playerInstanceRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [hasScrolledToHighlight, setHasScrolledToHighlight] = useState(false)
  const [playerError, setPlayerError] = useState(null)

  // Get timestamp from URL or highlighted result
  const startTime = searchParams.get('t') 
    ? parseFloat(searchParams.get('t')) 
    : highlightedTimestamp

  const searchTerm = searchParams.get('q') || searchQuery

  // Calculate video duration from transcript if not available
  const videoDuration = useMemo(() => {
    if (video?.duration && video.duration > 0) {
      return video.duration
    }
    // Calculate from last transcript segment
    if (video?.transcript && video.transcript.length > 0) {
      const lastSegment = video.transcript[video.transcript.length - 1]
      return lastSegment.end || lastSegment.start + (lastSegment.duration || 5)
    }
    return 0
  }, [video])

  const videoDurationFormatted = useMemo(() => {
    if (video?.durationFormatted && video.durationFormatted !== '0:00') {
      return video.durationFormatted
    }
    return formatDuration(videoDuration)
  }, [video, videoDuration])

  // Find all matching segments for highlighting
  const matchingSegments = useMemo(() => {
    if (!video?.transcript || !searchTerm) return []
    return video.transcript.filter(seg => 
      seg.text.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [video?.transcript, searchTerm])

  // Initialize YouTube Player
  useEffect(() => {
    if (!video || !playerContainerRef.current) return

    // Clean up previous player
    if (playerInstanceRef.current) {
      try {
        playerInstanceRef.current.destroy()
      } catch (e) {}
      playerInstanceRef.current = null
    }

    setIsPlayerReady(false)
    setPlayerError(null)

    // Create a new div for the player
    const playerDiv = document.createElement('div')
    playerDiv.id = `youtube-player-${video.id}`
    playerContainerRef.current.innerHTML = ''
    playerContainerRef.current.appendChild(playerDiv)

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 100)
        return
      }

      try {
        playerInstanceRef.current = new window.YT.Player(playerDiv.id, {
          videoId: video.id,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: startTime ? 1 : 0,
            start: startTime ? Math.floor(startTime) : 0,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event) => {
              console.log('YouTube player ready')
              setIsPlayerReady(true)
              if (startTime) {
                event.target.seekTo(startTime, true)
              }
            },
            onError: (event) => {
              console.error('YouTube player error:', event.data)
              setPlayerError(`Player error: ${event.data}`)
            },
            onStateChange: (event) => {
              // YT.PlayerState: PLAYING=1, PAUSED=2, BUFFERING=3
              if (event.data === 1) {
                setPlayerError(null)
              }
            }
          }
        })
      } catch (e) {
        console.error('Failed to create player:', e)
        setPlayerError('Failed to load video player')
      }
    }

    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.async = true
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
      
      window.onYouTubeIframeAPIReady = initPlayer
    } else {
      initPlayer()
    }

    return () => {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy()
        } catch (e) {}
        playerInstanceRef.current = null
      }
    }
  }, [video?.id, startTime])

  // Track player time
  useEffect(() => {
    if (!isPlayerReady || !playerInstanceRef.current) return

    const interval = setInterval(() => {
      try {
        if (playerInstanceRef.current?.getCurrentTime) {
          const time = playerInstanceRef.current.getCurrentTime()
          setCurrentTime(time)
        }
      } catch (e) {}
    }, 500)

    return () => clearInterval(interval)
  }, [isPlayerReady])

  // Scroll to top of page on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [videoId])

  // On desktop, auto-scroll to highlighted segment after delay
  // On mobile, we'll show a "Jump to match" button instead
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  
  useEffect(() => {
    if (highlightRef.current && startTime && !hasScrolledToHighlight && !isMobile) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
        setHasScrolledToHighlight(true)
      }, 1500) // Longer delay to let user see video first
    }
  }, [startTime, video, hasScrolledToHighlight, isMobile])

  const scrollToHighlight = () => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
      setHasScrolledToHighlight(true)
    }
  }

  const seekTo = useCallback((time) => {
    if (playerInstanceRef.current?.seekTo && isPlayerReady) {
      playerInstanceRef.current.seekTo(time, true)
      playerInstanceRef.current.playVideo()
      setCurrentTime(time)
    }
  }, [isPlayerReady])

  const highlightText = useCallback((text, term) => {
    if (!term) return text
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) => 
      regex.test(part) 
        ? <mark key={i} className="bg-yt-red/30 text-white px-0.5 rounded font-medium">{part}</mark>
        : part
    )
  }, [])

  const isSegmentActive = useCallback((segment) => {
    return currentTime >= segment.start && currentTime < segment.end
  }, [currentTime])

  const isSegmentHighlighted = useCallback((segment) => {
    if (!startTime) return false
    return Math.abs(segment.start - startTime) < 1
  }, [startTime])

  const isSegmentMatching = useCallback((segment) => {
    if (!searchTerm) return false
    return segment.text.toLowerCase().includes(searchTerm.toLowerCase())
  }, [searchTerm])

  const openInYouTube = () => {
    const time = Math.floor(currentTime)
    window.open(`https://youtube.com/watch?v=${videoId}&t=${time}s`, '_blank')
  }

  if (!video) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h2 className="text-xl font-display font-semibold text-white mb-2">
            Video not found
          </h2>
          <button onClick={() => navigate('/')} className="text-yt-red hover:underline">
            Go back home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Mobile: Floating "Jump to match" button */}
      {searchTerm && matchingSegments.length > 0 && !hasScrolledToHighlight && isMobile && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <button
            onClick={scrollToHighlight}
            className="flex items-center gap-2 px-4 py-3 bg-yt-red text-white rounded-full shadow-lg shadow-yt-red/30 hover:bg-yt-dark-red transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="font-medium">Jump to match</span>
          </button>
        </div>
      )}

      {/* Back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-charcoal-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>

        <button
          onClick={openInYouTube}
          className="flex items-center gap-2 px-3 py-1.5 bg-charcoal-800 hover:bg-charcoal-700 rounded-lg text-sm text-charcoal-300 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>
          Open in YouTube
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player Section */}
        <div className="lg:col-span-2">
          {/* Player Container */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
            <div ref={playerContainerRef} className="w-full h-full" />
            {playerError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center p-4">
                  <p className="text-red-400 mb-2">{playerError}</p>
                  <button
                    onClick={openInYouTube}
                    className="px-4 py-2 bg-yt-red text-white rounded-lg hover:bg-yt-dark-red transition-colors"
                  >
                    Watch on YouTube
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="mt-4">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-white">
              {video.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-charcoal-400">
              <span>{video.channelName}</span>
              {videoDurationFormatted && videoDurationFormatted !== '0:00' && (
                <>
                  <span>•</span>
                  <span>{videoDurationFormatted}</span>
                </>
              )}
              {video.transcript && (
                <>
                  <span>•</span>
                  <span>{video.transcript.length} segments</span>
                </>
              )}
            </div>
          </div>

          {/* Search context */}
          {searchTerm && matchingSegments.length > 0 && (
            <div className="mt-4 p-3 bg-yt-red/10 border border-yt-red/20 rounded-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-charcoal-300">
                  Showing <span className="text-white font-medium">{matchingSegments.length}</span> results for: 
                  <span className="text-yt-red font-medium ml-1">"{searchTerm}"</span>
                </p>
                <div className="flex items-center gap-1 flex-wrap">
                  {matchingSegments.slice(0, 5).map((seg, i) => (
                    <button
                      key={i}
                      onClick={() => seekTo(seg.start)}
                      className="px-2 py-0.5 text-xs font-mono bg-charcoal-800 hover:bg-yt-red/30 text-charcoal-400 hover:text-white rounded transition-colors"
                      title={seg.text.substring(0, 50)}
                    >
                      {formatTimestamp(seg.start)}
                    </button>
                  ))}
                  {matchingSegments.length > 5 && (
                    <span className="text-xs text-charcoal-500">+{matchingSegments.length - 5}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transcript Section */}
        <div className="lg:col-span-1">
          <div className="bg-charcoal-900 rounded-xl border border-charcoal-800 sticky top-24">
            <div className="p-4 border-b border-charcoal-800">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-yt-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Transcript
                </h2>
                {video.language && (
                  <span className="text-xs bg-charcoal-800 text-charcoal-400 px-2 py-1 rounded">
                    {video.language}
                    {video.isAutoGenerated && ' • Auto'}
                  </span>
                )}
              </div>
              
              {/* Current time indicator */}
              <div className="mt-2 flex items-center gap-2 text-xs text-charcoal-500">
                <span className="font-mono text-yt-red">{formatTimestamp(currentTime)}</span>
                <div className="flex-1 h-1 bg-charcoal-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yt-red transition-all duration-300"
                    style={{ width: `${videoDuration ? (currentTime / videoDuration) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-mono">{videoDurationFormatted}</span>
              </div>
            </div>

            <div 
              ref={transcriptRef}
              className="max-h-[60vh] overflow-y-auto p-2"
            >
              {video.transcript?.map((segment, index) => {
                const isActive = isSegmentActive(segment)
                const isHighlight = isSegmentHighlighted(segment)
                const isMatching = isSegmentMatching(segment)

                return (
                  <div
                    key={index}
                    ref={isHighlight ? highlightRef : null}
                    onClick={() => seekTo(segment.start)}
                    className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-all group ${
                      isActive 
                        ? 'bg-charcoal-800 border-l-2 border-yt-red' 
                        : isHighlight
                        ? 'bg-yt-red/15 border-l-2 border-yt-red animate-pulse-soft'
                        : isMatching
                        ? 'bg-yt-red/5 hover:bg-charcoal-800/50'
                        : 'hover:bg-charcoal-800/50'
                    }`}
                  >
                    <span className={`transcript-timestamp flex-shrink-0 group-hover:text-yt-red transition-colors ${
                      isActive || isHighlight ? 'text-yt-red' : ''
                    }`}>
                      {formatTimestamp(segment.start)}
                    </span>
                    <span className={`text-sm leading-relaxed transition-colors ${
                      isActive ? 'text-white' : 'text-charcoal-300'
                    }`}>
                      {isMatching 
                        ? highlightText(segment.text, searchTerm)
                        : segment.text
                      }
                    </span>
                  </div>
                )
              })}

              {(!video.transcript || video.transcript.length === 0) && (
                <p className="text-center text-charcoal-500 py-8">
                  No transcript available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

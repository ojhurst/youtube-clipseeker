import { useNavigate } from 'react-router-dom'
import { formatDuration } from '../services/youtubeUtils'
import { useMemo } from 'react'

export default function VideoCard({ video, showDelete = false, onDelete }) {
  const navigate = useNavigate()

  // Calculate duration from transcript if not available
  const duration = useMemo(() => {
    if (video.duration && video.duration > 0) {
      return video.duration
    }
    if (video.transcript && video.transcript.length > 0) {
      const lastSegment = video.transcript[video.transcript.length - 1]
      return lastSegment.end || lastSegment.start + (lastSegment.duration || 5)
    }
    return 0
  }, [video])

  const durationFormatted = useMemo(() => {
    if (video.durationFormatted && video.durationFormatted !== '0:00') {
      return video.durationFormatted
    }
    if (duration > 0) {
      return formatDuration(duration)
    }
    return null
  }, [video.durationFormatted, duration])

  const handleClick = () => {
    navigate(`/video/${video.id}`)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(video.id)
    }
  }

  return (
    <div
      onClick={handleClick}
      className="video-card bg-charcoal-900 rounded-xl overflow-hidden cursor-pointer group border border-charcoal-800 hover:border-charcoal-700 active:border-yt-red/50 transition-colors"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover sm:group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Duration badge */}
        {durationFormatted && (
          <span className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-black/80 text-white text-[10px] sm:text-xs font-mono px-1 sm:px-1.5 py-0.5 rounded">
            {durationFormatted}
          </span>
        )}
        {/* Play overlay - subtle on mobile */}
        <div className="absolute inset-0 bg-black/20 sm:bg-black/40 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-yt-red/80 sm:bg-yt-red/90 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        {/* Delete button - always visible on mobile when showDelete */}
        {showDelete && (
          <button
            onClick={handleDelete}
            className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-7 h-7 sm:w-8 sm:h-8 bg-black/70 hover:bg-red-600 active:bg-red-700 rounded-lg flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-all"
            title="Delete video"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 sm:p-3">
        <h3 className="font-medium text-white text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2 group-hover:text-yt-red transition-colors leading-tight">
          {video.title}
        </h3>
        <p className="text-[10px] sm:text-xs text-charcoal-400 truncate">
          {video.channelName || 'Unknown Channel'}
        </p>
      </div>
    </div>
  )
}

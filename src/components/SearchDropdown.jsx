import { useNavigate } from 'react-router-dom'
import { formatTimestamp } from '../services/youtubeUtils'
import { useStore } from '../store/useStore'

export default function SearchDropdown({ results, query, onClose }) {
  const navigate = useNavigate()
  const { setHighlightedTimestamp } = useStore()

  if (!query || results.length === 0) return null

  const highlightText = (text, term) => {
    if (!term) return text
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) => 
      regex.test(part) 
        ? <mark key={i} className="bg-yt-red/30 text-white px-0.5 rounded">{part}</mark>
        : part
    )
  }

  const getSnippet = (text, term, contextChars = 30) => {
    const lowerText = text.toLowerCase()
    const lowerTerm = term.toLowerCase()
    const idx = lowerText.indexOf(lowerTerm)
    if (idx === -1) return text.slice(0, 80)
    
    const start = Math.max(0, idx - contextChars)
    const end = Math.min(text.length, idx + term.length + contextChars)
    let snippet = text.slice(start, end)
    if (start > 0) snippet = '...' + snippet
    if (end < text.length) snippet += '...'
    return snippet
  }

  const handleInternalClick = (e, video, match) => {
    e.preventDefault()
    e.stopPropagation()
    setHighlightedTimestamp(match.start)
    navigate(`/video/${video.id}?t=${match.start}&q=${encodeURIComponent(query)}`)
    onClose()
  }

  const handleYouTubeClick = (e, videoId, timestamp) => {
    e.preventDefault()
    e.stopPropagation()
    const seconds = Math.floor(timestamp)
    window.open(`https://youtube.com/watch?v=${videoId}&t=${seconds}s`, '_blank')
  }

  const handleVideoClick = (e, videoId) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/video/${videoId}?q=${encodeURIComponent(query)}`)
    onClose()
  }

  const handleMoreMatchesClick = (e, videoId) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/video/${videoId}?q=${encodeURIComponent(query)}`)
    onClose()
  }

  const handleViewAllClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/search?q=${encodeURIComponent(query)}`)
    onClose()
  }

  const totalMatches = results.reduce((acc, r) => acc + r.totalMatches, 0)

  return (
    <div 
      className="absolute top-full left-0 right-0 bg-charcoal-900 border border-charcoal-700 rounded-b-xl sm:rounded-xl sm:mt-2 shadow-2xl overflow-hidden z-50 max-h-[80vh] sm:max-h-[70vh] overflow-y-auto animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="sticky top-0 bg-charcoal-900/95 backdrop-blur-sm px-3 sm:px-4 py-2.5 sm:py-3 border-b border-charcoal-800 z-10">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm text-charcoal-400">
            <span className="text-white font-medium">{totalMatches}</span> match{totalMatches !== 1 ? 'es' : ''} in{' '}
            <span className="text-white font-medium">{results.length}</span> video{results.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={handleViewAllClick}
            className="text-xs text-yt-red hover:text-white transition-colors font-medium"
          >
            View all →
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="divide-y divide-charcoal-800">
        {results.slice(0, 5).map(({ video, matches, totalMatches }) => (
          <div key={video.id} className="p-3 sm:p-4">
            {/* Video Header - Stacked on mobile */}
            <div 
              className="flex gap-2 sm:gap-3 mb-2 sm:mb-3 cursor-pointer group"
              onClick={(e) => handleVideoClick(e, video.id)}
            >
              {/* Thumbnail */}
              <div className="w-16 h-10 sm:w-24 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 relative">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>

              {/* Title & Channel */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-medium text-white line-clamp-2 sm:line-clamp-1 group-hover:text-yt-red transition-colors leading-tight">
                  {video.title}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                  <p className="text-[10px] sm:text-xs text-charcoal-500 truncate">{video.channelName}</p>
                  <span className="text-[10px] sm:text-xs text-yt-red font-medium">
                    {totalMatches} match{totalMatches !== 1 ? 'es' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Match Snippets - Full width on mobile */}
            <div className="space-y-1 sm:space-y-1.5 sm:ml-[6.5rem]">
              {matches.slice(0, 2).map((match, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-2 p-2 -mx-1 sm:-mx-2 rounded-lg bg-charcoal-800/30 sm:bg-transparent sm:hover:bg-charcoal-800/50 cursor-pointer transition-colors active:bg-charcoal-700/50"
                  onClick={(e) => handleInternalClick(e, video, match)}
                >
                  {/* Timestamp Badge */}
                  <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-charcoal-800 text-yt-red text-[10px] sm:text-xs font-mono rounded">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    {formatTimestamp(match.start)}
                  </span>

                  {/* Snippet */}
                  <p className="flex-1 text-[11px] sm:text-xs text-charcoal-300 leading-relaxed line-clamp-2">
                    {highlightText(getSnippet(match.text, query), query)}
                  </p>

                  {/* Quick YouTube button - always visible on mobile */}
                  <button
                    onClick={(e) => handleYouTubeClick(e, video.id, match.start)}
                    className="flex-shrink-0 p-1.5 rounded-md bg-charcoal-700 sm:bg-transparent sm:hover:bg-red-600 text-charcoal-400 sm:text-charcoal-500 hover:text-white transition-colors"
                    title="Open in YouTube"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                  </button>
                </div>
              ))}

              {/* Show more matches */}
              {totalMatches > 2 && (
                <div 
                  onClick={(e) => handleMoreMatchesClick(e, video.id)}
                  className="flex items-center justify-center sm:justify-start gap-2 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  <span className="text-xs text-yt-red font-medium">
                    +{totalMatches - 2} more →
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer - View all results */}
      <div className="sticky bottom-0 bg-charcoal-950 border-t border-charcoal-800 z-10">
        {results.length > 5 && (
          <div 
            onClick={handleViewAllClick}
            className="px-3 sm:px-4 py-3 text-center cursor-pointer hover:bg-charcoal-900 active:bg-charcoal-800 transition-colors border-b border-charcoal-800"
          >
            <span className="text-sm text-yt-red font-medium">
              View all {results.length} videos →
            </span>
          </div>
        )}
        <div className="px-3 sm:px-4 py-2 flex items-center justify-center sm:justify-between text-[10px] sm:text-xs text-charcoal-600">
          <span>Tap result to view</span>
          <span className="hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-charcoal-800 rounded text-charcoal-400">↵</kbd>
            <span>full results</span>
          </span>
        </div>
      </div>
    </div>
  )
}

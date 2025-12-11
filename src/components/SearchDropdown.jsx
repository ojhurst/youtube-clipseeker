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

  const getSnippet = (text, term, contextChars = 40) => {
    const lowerText = text.toLowerCase()
    const lowerTerm = term.toLowerCase()
    const idx = lowerText.indexOf(lowerTerm)
    if (idx === -1) return text
    
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
      className="absolute top-full left-0 right-0 mt-2 bg-charcoal-900 border border-charcoal-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="sticky top-0 bg-charcoal-900/95 backdrop-blur-sm px-4 py-3 border-b border-charcoal-800 z-10">
        <div className="flex items-center justify-between">
          <p className="text-sm text-charcoal-400">
            Found <span className="text-white font-medium">{totalMatches}</span> match{totalMatches !== 1 ? 'es' : ''} in{' '}
            <span className="text-white font-medium">{results.length}</span> video{results.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={handleViewAllClick}
            className="text-xs text-yt-red hover:text-white transition-colors"
          >
            View all →
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="divide-y divide-charcoal-800">
        {results.slice(0, 5).map(({ video, matches, totalMatches }) => (
          <div key={video.id} className="p-4">
            {/* Video Header */}
            <div 
              className="flex gap-3 mb-3 cursor-pointer group"
              onClick={(e) => handleVideoClick(e, video.id)}
            >
              {/* Thumbnail */}
              <div className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 relative">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>

              {/* Title & Channel */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white line-clamp-1 group-hover:text-yt-red transition-colors">
                  {video.title}
                </h4>
                <p className="text-xs text-charcoal-500 mt-0.5">{video.channelName}</p>
                <p className="text-xs text-charcoal-600 mt-1">
                  {totalMatches} match{totalMatches !== 1 ? 'es' : ''} found
                </p>
              </div>
            </div>

            {/* Match Snippets */}
            <div className="space-y-1.5 ml-[6.5rem]">
              {matches.slice(0, 3).map((match, idx) => (
                <div 
                  key={idx}
                  className="group flex items-start gap-2 p-2 -mx-2 rounded-lg hover:bg-charcoal-800/50 cursor-pointer transition-colors"
                  onClick={(e) => handleInternalClick(e, video, match)}
                >
                  {/* Timestamp Badge */}
                  <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-charcoal-800 group-hover:bg-yt-red/20 text-charcoal-400 group-hover:text-yt-red text-xs font-mono rounded transition-colors">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    {formatTimestamp(match.start)}
                  </span>

                  {/* Snippet */}
                  <p className="flex-1 text-xs text-charcoal-300 leading-relaxed line-clamp-2">
                    {highlightText(getSnippet(match.text, query), query)}
                  </p>

                  {/* Quick Actions */}
                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Open in YouTube */}
                    <button
                      onClick={(e) => handleYouTubeClick(e, video.id, match.start)}
                      className="p-1.5 rounded-md bg-charcoal-700 hover:bg-red-600 text-charcoal-300 hover:text-white transition-colors"
                      title="Open in YouTube"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                      </svg>
                    </button>
                    {/* Arrow indicator */}
                    <div className="p-1.5 text-charcoal-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}

              {/* Show more matches - made more prominent and clickable */}
              {totalMatches > 3 && (
                <div 
                  onClick={(e) => handleMoreMatchesClick(e, video.id)}
                  className="flex items-center gap-2 p-2 -mx-2 rounded-lg hover:bg-yt-red/10 cursor-pointer transition-colors group"
                >
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-[52px] h-5 bg-charcoal-800 group-hover:bg-yt-red/20 text-charcoal-500 group-hover:text-yt-red text-xs font-mono rounded transition-colors">
                    +{totalMatches - 3}
                  </span>
                  <span className="text-xs text-charcoal-500 group-hover:text-yt-red transition-colors">
                    more match{totalMatches - 3 !== 1 ? 'es' : ''} in this video →
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
            className="px-4 py-3 text-center cursor-pointer hover:bg-charcoal-900 transition-colors border-b border-charcoal-800"
          >
            <span className="text-sm text-charcoal-400 hover:text-yt-red transition-colors">
              View all {results.length} videos with matches →
            </span>
          </div>
        )}
        <div className="px-4 py-2 flex items-center justify-between text-xs text-charcoal-600">
          <span>Click result to view in app</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-charcoal-800 rounded text-charcoal-400">↵</kbd>
            <span>full results page</span>
          </span>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useCallback, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { formatTimestamp } from '../services/youtubeUtils'

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { search, searchResults, searchQuery, setHighlightedTimestamp } = useStore()
  const [expandedVideos, setExpandedVideos] = useState(new Set())

  const query = searchParams.get('q') || ''

  useEffect(() => {
    if (query && query !== searchQuery) {
      search(query)
    }
  }, [query])

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

  const handleResultClick = (video, match) => {
    setHighlightedTimestamp(match.start)
    navigate(`/video/${video.id}?t=${match.start}&q=${encodeURIComponent(query)}`)
  }

  const handleYouTubeClick = (e, videoId, timestamp) => {
    e.stopPropagation()
    const seconds = Math.floor(timestamp)
    window.open(`https://youtube.com/watch?v=${videoId}&t=${seconds}s`, '_blank')
  }

  const getContextSnippet = (text, term, maxLength = 120) => {
    const lowerText = text.toLowerCase()
    const lowerTerm = term.toLowerCase()
    const termIndex = lowerText.indexOf(lowerTerm)
    
    if (termIndex === -1) return text
    
    const start = Math.max(0, termIndex - 40)
    const end = Math.min(text.length, termIndex + term.length + 80)
    
    let snippet = text.slice(start, end)
    if (start > 0) snippet = '...' + snippet
    if (end < text.length) snippet = snippet + '...'
    
    return snippet
  }

  const toggleExpanded = (videoId) => {
    setExpandedVideos(prev => {
      const next = new Set(prev)
      if (next.has(videoId)) {
        next.delete(videoId)
      } else {
        next.add(videoId)
      }
      return next
    })
  }

  const totalMatches = searchResults.reduce((acc, r) => acc + r.totalMatches, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-charcoal-400 hover:text-white mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
        
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Search Results
        </h1>
        {query && (
          <p className="text-charcoal-400 mt-2">
            {searchResults.length > 0 ? (
              <>
                Found <span className="text-white font-medium">{totalMatches}</span> match{totalMatches !== 1 ? 'es' : ''} in{' '}
                <span className="text-white font-medium">{searchResults.length}</span> video{searchResults.length !== 1 ? 's' : ''} for{' '}
                "<span className="text-yt-red font-medium">{query}</span>"
              </>
            ) : (
              <>No results found for "<span className="text-yt-red">{query}</span>"</>
            )}
          </p>
        )}
      </div>

      {/* Results */}
      {searchResults.length > 0 ? (
        <div className="space-y-6">
          {searchResults.map(({ video, matches, totalMatches }) => {
            const isExpanded = expandedVideos.has(video.id)
            const displayMatches = isExpanded ? matches : matches.slice(0, 5)
            
            return (
              <div 
                key={video.id}
                className="bg-charcoal-900 rounded-xl border border-charcoal-800 overflow-hidden animate-fade-in"
              >
                {/* Video Header */}
                <div className="p-4 border-b border-charcoal-800 bg-charcoal-900/50">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div 
                      className="w-48 aspect-video rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group relative"
                      onClick={() => navigate(`/video/${video.id}?q=${encodeURIComponent(query)}`)}
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-yt-red/90 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                      {/* Match count badge */}
                      <div className="absolute top-2 right-2 px-2 py-1 bg-yt-red text-white text-xs font-medium rounded-full">
                        {totalMatches} match{totalMatches !== 1 ? 'es' : ''}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-medium text-white text-lg line-clamp-2 cursor-pointer hover:text-yt-red transition-colors"
                        onClick={() => navigate(`/video/${video.id}?q=${encodeURIComponent(query)}`)}
                      >
                        {video.title}
                      </h3>
                      <p className="text-sm text-charcoal-400 mt-1">
                        {video.channelName}
                      </p>
                      
                      {/* Quick timestamp buttons */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="text-xs text-charcoal-500">Jump to:</span>
                        {matches.slice(0, 6).map((match, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleResultClick(video, match)}
                            className="px-2 py-1 text-xs font-mono bg-charcoal-800 hover:bg-yt-red/20 text-charcoal-400 hover:text-yt-red rounded transition-colors"
                            title={match.text.substring(0, 60)}
                          >
                            {formatTimestamp(match.start)}
                          </button>
                        ))}
                        {matches.length > 6 && (
                          <span className="text-xs text-charcoal-600">+{matches.length - 6} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Matches */}
                <div className="divide-y divide-charcoal-800/50">
                  {displayMatches.map((match, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleResultClick(video, match)}
                      className="p-4 hover:bg-charcoal-800/30 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Timestamp */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-charcoal-800 group-hover:bg-yt-red/20 text-charcoal-300 group-hover:text-yt-red text-sm font-mono rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                            {formatTimestamp(match.start)}
                          </span>
                          
                          {/* YouTube button */}
                          <button
                            onClick={(e) => handleYouTubeClick(e, video.id, match.start)}
                            className="p-2 rounded-lg bg-charcoal-800 hover:bg-red-600 text-charcoal-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                            title="Open in YouTube at this time"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                            </svg>
                          </button>
                        </div>

                        {/* Snippet */}
                        <p className="flex-1 text-sm text-charcoal-300 leading-relaxed">
                          {highlightText(getContextSnippet(match.text, query), query)}
                        </p>

                        {/* Arrow */}
                        <svg className="w-5 h-5 text-charcoal-600 group-hover:text-yt-red transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expand/Collapse button */}
                {totalMatches > 5 && (
                  <div className="p-3 border-t border-charcoal-800 bg-charcoal-950/50">
                    <button
                      onClick={() => toggleExpanded(video.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm text-charcoal-400 hover:text-yt-red transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Show less
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Show all {totalMatches} matches
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : query ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-charcoal-900 flex items-center justify-center">
            <svg className="w-10 h-10 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-display font-semibold text-white mb-2">
            No results found
          </h3>
          <p className="text-charcoal-400 max-w-md mx-auto mb-6">
            Try a different search term or add more videos to your library.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary px-6 py-2.5 rounded-xl text-white font-medium"
          >
            Add Videos
          </button>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-charcoal-400">
            Enter a search term to find matches in your video transcripts.
          </p>
        </div>
      )}
    </div>
  )
}

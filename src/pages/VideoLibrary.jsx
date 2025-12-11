import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import VideoCard from '../components/VideoCard'

export default function VideoLibrary() {
  const { videos, channels, failedVideos, deleteVideo } = useStore()
  const [sortBy, setSortBy] = useState('recent')
  const [filterChannel, setFilterChannel] = useState('all')
  const [showFailed, setShowFailed] = useState(false)

  const sortedVideos = useMemo(() => {
    let filtered = [...videos]

    // Filter by channel
    if (filterChannel !== 'all') {
      filtered = filtered.filter(v => v.channelId === filterChannel)
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
        break
      case 'oldest':
        filtered.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0))
        break
      case 'title':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        break
      case 'channel':
        filtered.sort((a, b) => (a.channelName || '').localeCompare(b.channelName || ''))
        break
      default:
        break
    }

    return filtered
  }, [videos, sortBy, filterChannel])

  const handleDelete = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      await deleteVideo(videoId)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Video Library
          </h1>
          <p className="text-charcoal-400 mt-1">
            {videos.length} video{videos.length !== 1 ? 's' : ''} indexed
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Channel filter */}
          {channels.length > 0 && (
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="bg-charcoal-900 border border-charcoal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yt-red/50"
            >
              <option value="all">All Channels</option>
              {channels.map(channel => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          )}

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-charcoal-900 border border-charcoal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yt-red/50"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title A-Z</option>
            <option value="channel">By Channel</option>
          </select>

          {/* Show failed toggle */}
          {failedVideos.length > 0 && (
            <button
              onClick={() => setShowFailed(!showFailed)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showFailed
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                  : 'bg-charcoal-900 text-charcoal-400 border border-charcoal-700 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{failedVideos.length} Failed</span>
            </button>
          )}
        </div>
      </div>

      {/* Videos Grid */}
      {sortedVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedVideos.map((video) => (
            <VideoCard 
              key={video.id} 
              video={video} 
              showDelete={true}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-charcoal-900 flex items-center justify-center">
            <svg className="w-10 h-10 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-display font-semibold text-white mb-2">
            No videos yet
          </h3>
          <p className="text-charcoal-400 max-w-md mx-auto">
            Add your first video by pasting a YouTube URL on the home page.
          </p>
        </div>
      )}

      {/* Failed Videos Section */}
      {showFailed && failedVideos.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Videos Without Transcripts
          </h2>
          <div className="bg-charcoal-900 rounded-xl border border-charcoal-800 divide-y divide-charcoal-800">
            {failedVideos.map((video) => (
              <div key={video.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-charcoal-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-charcoal-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{video.id}</p>
                    <p className="text-xs text-red-400">{video.error}</p>
                  </div>
                </div>
                <a
                  href={`https://youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-charcoal-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


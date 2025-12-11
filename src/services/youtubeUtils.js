// YouTube URL parsing utilities

export const parseYouTubeUrl = (url) => {
  if (!url) return null

  // Clean the URL
  url = url.trim()

  // Video URL patterns - check these FIRST
  const videoPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/
  ]

  for (const pattern of videoPatterns) {
    const match = url.match(pattern)
    if (match) {
      return {
        type: 'video',
        videoId: match[1]
      }
    }
  }

  // Playlist URL pattern
  const playlistPattern = /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/
  const playlistMatch = url.match(playlistPattern)
  if (playlistMatch) {
    return {
      type: 'playlist',
      playlistId: playlistMatch[1]
    }
  }

  // Channel URL patterns - explicit formats
  const channelPatterns = [
    { pattern: /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/, isHandle: false },
    { pattern: /youtube\.com\/@([a-zA-Z0-9_.-]+)/, isHandle: true },
    { pattern: /youtube\.com\/c\/([a-zA-Z0-9_.-]+)/, isHandle: false },
    { pattern: /youtube\.com\/user\/([a-zA-Z0-9_.-]+)/, isHandle: false },
  ]

  for (const { pattern, isHandle } of channelPatterns) {
    const match = url.match(pattern)
    if (match) {
      return {
        type: 'channel',
        channelIdentifier: match[1],
        isHandle
      }
    }
  }

  // NEW: Handle simplified channel URLs like youtube.com/ChannelName
  // These don't have @, /c/, /channel/, or /user/ prefix
  // Match: youtube.com/SomeName or www.youtube.com/SomeName
  const simplifiedChannelPattern = /(?:www\.)?youtube\.com\/([a-zA-Z][a-zA-Z0-9_.-]{2,})(?:\/.*)?$/
  const simplifiedMatch = url.match(simplifiedChannelPattern)
  
  if (simplifiedMatch) {
    const identifier = simplifiedMatch[1]
    
    // Exclude known YouTube paths that aren't channels
    const excludedPaths = [
      'watch', 'playlist', 'channel', 'c', 'user', 'feed', 'results', 
      'gaming', 'music', 'movies', 'premium', 'shorts', 'live',
      'account', 'reporthistory', 'upload', 'embed', 'tv', 'kids'
    ]
    
    if (!excludedPaths.includes(identifier.toLowerCase())) {
      return {
        type: 'channel',
        channelIdentifier: identifier,
        isHandle: true  // Treat simplified URLs like handles
      }
    }
  }

  return null
}

export const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const formatTimestamp = (seconds) => {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const parseTimestamp = (timestamp) => {
  // Parse [MM:SS] or MM:SS format
  const match = timestamp.match(/\[?(\d+):(\d+)\]?/)
  if (match) {
    return parseInt(match[1]) * 60 + parseInt(match[2])
  }
  return 0
}

export const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export const getYouTubeThumbnail = (videoId, quality = 'mqdefault') => {
  // Quality options: default, mqdefault, hqdefault, sddefault, maxresdefault
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

export const getYouTubeEmbedUrl = (videoId, startTime = 0) => {
  return `https://www.youtube.com/embed/${videoId}?start=${Math.floor(startTime)}&enablejsapi=1`
}

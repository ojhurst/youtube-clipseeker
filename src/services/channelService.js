// Channel service for fetching video lists from YouTube channels with pagination

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
]

const VIDEOS_PER_PAGE = 30

// Try fetching with multiple proxies
const fetchWithProxy = async (url) => {
  let lastError = null
  
  for (const proxy of CORS_PROXIES) {
    try {
      const response = await fetch(proxy + encodeURIComponent(url), {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      })
      
      if (response.ok) {
        return await response.text()
      }
    } catch (error) {
      lastError = error
      console.warn(`Proxy ${proxy} failed:`, error.message)
    }
  }
  
  throw lastError || new Error('All proxies failed')
}

// Fetch channel videos with pagination support
export const fetchChannelVideosWithPagination = async (channelIdentifier, isHandle = false, onBatchProgress) => {
  let allVideoIds = new Set()
  let channelInfo = null
  let continuationToken = null
  let batchNumber = 1
  let hasMore = true
  
  // Build initial channel URL
  const urlsToTry = []
  if (isHandle) {
    urlsToTry.push(`https://www.youtube.com/@${channelIdentifier}/videos`)
    urlsToTry.push(`https://www.youtube.com/${channelIdentifier}/videos`)
  }
  if (channelIdentifier.startsWith('UC')) {
    urlsToTry.push(`https://www.youtube.com/channel/${channelIdentifier}/videos`)
  }
  urlsToTry.push(`https://www.youtube.com/c/${channelIdentifier}/videos`)
  if (!urlsToTry.includes(`https://www.youtube.com/${channelIdentifier}/videos`)) {
    urlsToTry.push(`https://www.youtube.com/${channelIdentifier}/videos`)
  }

  // Fetch first page
  let html = null
  let successUrl = null
  
  for (const channelUrl of urlsToTry) {
    try {
      console.log(`Trying channel URL: ${channelUrl}`)
      html = await fetchWithProxy(channelUrl)
      
      if (html && html.length > 1000) {
        successUrl = channelUrl
        break
      }
    } catch (error) {
      console.warn(`Failed to fetch ${channelUrl}:`, error.message)
    }
  }
  
  if (!html) {
    throw new Error('Could not fetch channel. Please check the URL.')
  }

  // Extract channel info
  channelInfo = extractChannelInfo(html, channelIdentifier)
  
  // Extract initial video IDs
  const initialVideoIds = extractVideoIds(html)
  initialVideoIds.forEach(id => allVideoIds.add(id))
  
  // Try to get continuation token for more videos
  continuationToken = extractContinuationToken(html)
  
  // Report first batch
  if (onBatchProgress) {
    onBatchProgress({
      batch: batchNumber,
      totalBatches: continuationToken ? '?' : 1,
      videosFound: allVideoIds.size,
      status: 'Fetching video list...'
    })
  }
  
  // Fetch additional pages if continuation token exists
  while (continuationToken && batchNumber < 20) { // Max 20 batches (~600 videos) for safety
    batchNumber++
    
    if (onBatchProgress) {
      onBatchProgress({
        batch: batchNumber,
        totalBatches: '?',
        videosFound: allVideoIds.size,
        status: `Loading more videos (batch ${batchNumber})...`
      })
    }
    
    try {
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const moreVideos = await fetchContinuation(continuationToken, channelInfo.id)
      
      if (moreVideos.videoIds.length === 0) {
        break
      }
      
      moreVideos.videoIds.forEach(id => allVideoIds.add(id))
      continuationToken = moreVideos.nextContinuation
      
      console.log(`Batch ${batchNumber}: Found ${moreVideos.videoIds.length} more videos (total: ${allVideoIds.size})`)
      
    } catch (error) {
      console.warn(`Failed to fetch continuation batch ${batchNumber}:`, error.message)
      break
    }
  }
  
  const videoIds = Array.from(allVideoIds)
  const estimatedBatches = Math.ceil(videoIds.length / VIDEOS_PER_PAGE)
  
  console.log(`Total videos found: ${videoIds.length}`)
  
  return {
    channel: channelInfo,
    videoIds,
    totalFound: videoIds.length,
    estimatedBatches
  }
}

// Extract continuation token from page HTML
const extractContinuationToken = (html) => {
  // Look for continuation token in ytInitialData
  const patterns = [
    /"continuationCommand":\s*{\s*"token":\s*"([^"]+)"/,
    /"continuation":\s*"([^"]+)"/,
    /continuationEndpoint.*?token.*?"([^"]{50,})"/,
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}

// Fetch more videos using continuation token
const fetchContinuation = async (token, channelId) => {
  const apiUrl = 'https://www.youtube.com/youtubei/v1/browse'
  
  const body = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20231219.04.00',
        hl: 'en',
        gl: 'US',
      }
    },
    continuation: token
  }
  
  try {
    // Try direct fetch first (might work without proxy for API calls)
    for (const proxy of ['', ...CORS_PROXIES]) {
      try {
        const url = proxy ? proxy + encodeURIComponent(apiUrl) : apiUrl
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        })
        
        if (response.ok) {
          const data = await response.json()
          return parseContinuationResponse(data)
        }
      } catch (e) {
        continue
      }
    }
  } catch (error) {
    console.warn('Continuation fetch failed:', error)
  }
  
  return { videoIds: [], nextContinuation: null }
}

// Parse continuation response for video IDs
const parseContinuationResponse = (data) => {
  const videoIds = new Set()
  let nextContinuation = null
  
  // Recursively search for video IDs in the response
  const findVideoIds = (obj) => {
    if (!obj || typeof obj !== 'object') return
    
    if (obj.videoId && typeof obj.videoId === 'string' && obj.videoId.length === 11) {
      videoIds.add(obj.videoId)
    }
    
    if (obj.continuationCommand?.token) {
      nextContinuation = obj.continuationCommand.token
    }
    
    if (obj.token && typeof obj.token === 'string' && obj.token.length > 50) {
      nextContinuation = obj.token
    }
    
    if (Array.isArray(obj)) {
      obj.forEach(findVideoIds)
    } else {
      Object.values(obj).forEach(findVideoIds)
    }
  }
  
  findVideoIds(data)
  
  return {
    videoIds: Array.from(videoIds),
    nextContinuation
  }
}

// Extract channel info from HTML
const extractChannelInfo = (html, identifier) => {
  let channelName = identifier
  let channelId = identifier

  const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/)
  if (titleMatch) {
    channelName = titleMatch[1]
  }
  
  if (channelName === identifier) {
    const pageTitleMatch = html.match(/<title>([^<]+)<\/title>/)
    if (pageTitleMatch) {
      channelName = pageTitleMatch[1].replace(' - YouTube', '').trim()
    }
  }

  const channelIdMatch = html.match(/"channelId":"([^"]+)"/)
  if (channelIdMatch) {
    channelId = channelIdMatch[1]
  }
  
  if (channelId === identifier) {
    const altIdMatch = html.match(/channel\/([UC][a-zA-Z0-9_-]+)/)
    if (altIdMatch) {
      channelId = altIdMatch[1]
    }
  }

  let subscriberCount = null
  const subMatch = html.match(/"subscriberCountText":\s*{\s*"simpleText":\s*"([^"]+)"/)
  if (subMatch) {
    subscriberCount = subMatch[1]
  }

  let thumbnail = null
  const thumbMatch = html.match(/"avatar":\s*{\s*"thumbnails":\s*\[\s*{\s*"url":\s*"([^"]+)"/)
  if (thumbMatch) {
    thumbnail = thumbMatch[1].replace(/\\u0026/g, '&')
  }

  return {
    id: channelId,
    name: channelName,
    identifier,
    subscriberCount,
    thumbnail,
    url: `https://www.youtube.com/channel/${channelId}`
  }
}

// Extract video IDs from channel page HTML
const extractVideoIds = (html) => {
  const videoIds = new Set()
  
  const pattern1 = /"videoId":"([a-zA-Z0-9_-]{11})"/g
  let match
  while ((match = pattern1.exec(html)) !== null) {
    videoIds.add(match[1])
  }

  const pattern2 = /\/watch\?v=([a-zA-Z0-9_-]{11})/g
  while ((match = pattern2.exec(html)) !== null) {
    videoIds.add(match[1])
  }

  return Array.from(videoIds)
}

// Legacy function for backwards compatibility
export const fetchChannelVideos = async (channelIdentifier, isHandle = false, limit = null) => {
  const result = await fetchChannelVideosWithPagination(channelIdentifier, isHandle)
  
  if (limit) {
    return {
      ...result,
      videoIds: result.videoIds.slice(0, limit)
    }
  }
  
  return result
}

// Get recent videos (last N) from a channel
export const getRecentChannelVideos = async (channelIdentifier, isHandle = false, count = 5) => {
  const result = await fetchChannelVideosWithPagination(channelIdentifier, isHandle)
  return {
    ...result,
    videoIds: result.videoIds.slice(0, count)
  }
}

// Get all videos from a channel with pagination
export const getAllChannelVideos = async (channelIdentifier, isHandle = false, onBatchProgress) => {
  return fetchChannelVideosWithPagination(channelIdentifier, isHandle, onBatchProgress)
}

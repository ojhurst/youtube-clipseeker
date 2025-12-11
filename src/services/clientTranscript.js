/**
 * Client-side YouTube transcript fetching
 * Each user's browser fetches transcripts using their own IP
 * This avoids YouTube blocking cloud server IPs
 */

// CORS proxies - requests go through these but originate from user's IP
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
]

/**
 * Fetch with CORS proxy fallback
 */
async function fetchWithProxy(url) {
  // Try each proxy until one works
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url)
      const response = await fetch(proxyUrl)
      
      if (response.ok) {
        return await response.text()
      }
    } catch (e) {
      console.warn(`Proxy ${proxy} failed:`, e.message)
    }
  }
  throw new Error('All proxies failed')
}

/**
 * Get video info from YouTube oEmbed (doesn't need proxy)
 */
export async function getVideoInfo(videoId) {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    )
    if (response.ok) {
      const data = await response.json()
      return {
        title: data.title,
        author: data.author_name,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      }
    }
  } catch (e) {
    console.warn('oEmbed failed:', e)
  }
  return {
    title: `Video ${videoId}`,
    author: 'Unknown',
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  }
}

/**
 * Fetch transcript directly from user's browser
 */
export async function fetchTranscriptClient(videoId) {
  console.log(`🌐 Client-side fetch for: ${videoId}`)
  
  // Step 1: Fetch the video page to get caption track URL
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
  const html = await fetchWithProxy(videoUrl)
  
  if (!html || html.length < 1000) {
    throw new Error('Failed to fetch video page')
  }
  
  // Step 2: Extract caption track URL
  const captionUrl = extractCaptionUrl(html)
  
  if (!captionUrl) {
    // Check if video exists but has no captions
    if (html.includes('"playabilityStatus"')) {
      if (!html.includes('captionTracks')) {
        throw new Error('No captions available for this video')
      }
    }
    throw new Error('Could not find caption track')
  }
  
  console.log(`📝 Found caption URL, fetching...`)
  
  // Step 3: Fetch the caption XML
  const captionXml = await fetchWithProxy(captionUrl)
  
  if (!captionXml) {
    throw new Error('Failed to fetch captions')
  }
  
  // Step 4: Parse the XML into segments
  const segments = parseTranscriptXml(captionXml)
  
  if (segments.length === 0) {
    throw new Error('No transcript segments found')
  }
  
  console.log(`✅ Got ${segments.length} segments`)
  
  return segments
}

/**
 * Extract caption track URL from YouTube page HTML
 */
function extractCaptionUrl(html) {
  // Try multiple patterns
  const patterns = [
    // Standard captionTracks format
    /"captionTracks":\s*\[\s*\{[^}]*"baseUrl"\s*:\s*"([^"]+)"/,
    // Alternative format
    /"baseUrl"\s*:\s*"(https:\/\/www\.youtube\.com\/api\/timedtext[^"]+)"/,
    // Escaped format
    /"baseUrl":"(https:\\\/\\\/www\.youtube\.com\\\/api\\\/timedtext[^"]+)"/,
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) {
      let url = match[1]
      // Unescape URL
      url = url
        .replace(/\\u0026/g, '&')
        .replace(/\\\//g, '/')
        .replace(/\\"/g, '"')
      return url
    }
  }
  
  return null
}

/**
 * Parse YouTube caption XML into segments
 */
function parseTranscriptXml(xml) {
  const segments = []
  
  // Match <text start="X" dur="Y">content</text>
  const regex = /<text[^>]*start="([\d.]+)"[^>]*(?:dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/gi
  let match
  
  while ((match = regex.exec(xml)) !== null) {
    const start = parseFloat(match[1])
    const duration = match[2] ? parseFloat(match[2]) : 5
    let text = match[3]
    
    // Decode HTML entities
    text = decodeHtmlEntities(text)
      .replace(/<[^>]+>/g, '') // Remove nested tags
      .replace(/\s+/g, ' ')
      .trim()
    
    if (text) {
      segments.push({
        start,
        duration,
        end: start + duration,
        text
      })
    }
  }
  
  return segments
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  }
  
  let result = text
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char)
  }
  
  // Numeric entities
  result = result.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
  result = result.replace(/&#x([a-fA-F0-9]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
  
  return result
}

/**
 * Full client-side video processing
 */
export async function processVideoClient(videoId) {
  // Get video info (doesn't need proxy)
  const videoInfo = await getVideoInfo(videoId)
  
  // Get transcript (uses proxy for CORS)
  const transcript = await fetchTranscriptClient(videoId)
  
  // Calculate duration from last segment
  let duration = 0
  if (transcript.length > 0) {
    const lastSeg = transcript[transcript.length - 1]
    duration = Math.ceil(lastSeg.end)
  }
  
  return {
    id: videoId,
    title: videoInfo.title,
    channelName: videoInfo.author,
    thumbnail: videoInfo.thumbnail,
    thumbnailHigh: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    duration,
    durationFormatted: formatDuration(duration),
    transcript,
    language: 'en',
    isAutoGenerated: true,
    processedAt: Date.now()
  }
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}


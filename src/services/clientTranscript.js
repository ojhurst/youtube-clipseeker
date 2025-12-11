/**
 * Client-side YouTube transcript fetching
 * Each user's browser fetches transcripts using their own IP
 */

// CORS proxies - try multiple in case some are down
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
]

/**
 * Fetch with CORS proxy fallback
 */
async function fetchWithProxy(url, returnJson = false) {
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url)
      console.log(`🔄 Trying proxy: ${proxy.substring(0, 30)}...`)
      
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      })
      
      if (response.ok) {
        const text = await response.text()
        if (text && text.length > 100) {
          console.log(`✅ Proxy worked, got ${text.length} chars`)
          return returnJson ? JSON.parse(text) : text
        }
      }
    } catch (e) {
      console.warn(`❌ Proxy ${proxy.substring(0, 20)} failed:`, e.message)
    }
  }
  throw new Error('All CORS proxies failed')
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
 * Try to get transcript using multiple methods
 */
export async function fetchTranscriptClient(videoId) {
  console.log(`🌐 Client-side transcript fetch for: ${videoId}`)
  
  // Method 1: Try direct timedtext API (sometimes works)
  try {
    console.log('📝 Method 1: Direct timedtext API...')
    const transcript = await tryDirectTimedText(videoId)
    if (transcript && transcript.length > 0) {
      console.log(`✅ Method 1 worked! Got ${transcript.length} segments`)
      return transcript
    }
  } catch (e) {
    console.warn('Method 1 failed:', e.message)
  }

  // Method 2: Parse video page for caption tracks
  try {
    console.log('📝 Method 2: Parse video page...')
    const transcript = await tryVideoPageParse(videoId)
    if (transcript && transcript.length > 0) {
      console.log(`✅ Method 2 worked! Got ${transcript.length} segments`)
      return transcript
    }
  } catch (e) {
    console.warn('Method 2 failed:', e.message)
  }

  // Method 3: Try innertube API
  try {
    console.log('📝 Method 3: Innertube API...')
    const transcript = await tryInnertubeApi(videoId)
    if (transcript && transcript.length > 0) {
      console.log(`✅ Method 3 worked! Got ${transcript.length} segments`)
      return transcript
    }
  } catch (e) {
    console.warn('Method 3 failed:', e.message)
  }

  throw new Error('Could not retrieve transcript - no captions found')
}

/**
 * Method 1: Direct timedtext API
 */
async function tryDirectTimedText(videoId) {
  // Try common language codes
  const languages = ['en', 'en-US', 'en-GB', 'a.en']
  
  for (const lang of languages) {
    try {
      // Auto-generated captions URL format
      const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=srv3`
      const xml = await fetchWithProxy(url)
      
      if (xml && xml.includes('<text')) {
        return parseTranscriptXml(xml)
      }
    } catch (e) {
      // Try next language
    }
  }
  
  return null
}

/**
 * Method 2: Parse video page for caption URL
 */
async function tryVideoPageParse(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
  const html = await fetchWithProxy(videoUrl)
  
  if (!html || html.length < 1000) {
    throw new Error('Failed to fetch video page')
  }

  // Look for captionTracks in the page
  const captionUrl = extractCaptionUrl(html)
  
  if (!captionUrl) {
    // Check if captions exist at all
    if (!html.includes('captionTracks') && !html.includes('"captions"')) {
      throw new Error('No captions available for this video')
    }
    throw new Error('Could not extract caption URL')
  }

  console.log('📎 Found caption URL')
  const captionXml = await fetchWithProxy(captionUrl)
  
  if (!captionXml) {
    throw new Error('Failed to fetch caption data')
  }

  return parseTranscriptXml(captionXml)
}

/**
 * Method 3: Use YouTube's innertube API
 */
async function tryInnertubeApi(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
  const html = await fetchWithProxy(videoUrl)
  
  // Extract ytInitialPlayerResponse
  const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/)
  if (!playerResponseMatch) {
    throw new Error('Could not find player response')
  }

  try {
    const playerResponse = JSON.parse(playerResponseMatch[1])
    const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
    
    if (!captions || captions.length === 0) {
      throw new Error('No caption tracks in player response')
    }

    // Find English captions
    const englishTrack = captions.find(t => 
      t.languageCode === 'en' || 
      t.languageCode?.startsWith('en-') ||
      t.vssId?.includes('.en')
    ) || captions[0]

    if (!englishTrack?.baseUrl) {
      throw new Error('No valid caption track found')
    }

    let captionUrl = englishTrack.baseUrl
      .replace(/\\u0026/g, '&')
      .replace(/\\\//g, '/')

    // Add format parameter for XML
    if (!captionUrl.includes('fmt=')) {
      captionUrl += '&fmt=srv3'
    }

    console.log('📎 Found caption track via innertube')
    const captionXml = await fetchWithProxy(captionUrl)
    return parseTranscriptXml(captionXml)

  } catch (e) {
    throw new Error(`Innertube parse failed: ${e.message}`)
  }
}

/**
 * Extract caption track URL from YouTube page HTML
 */
function extractCaptionUrl(html) {
  const patterns = [
    // Look for baseUrl in captionTracks
    /"captionTracks":\s*\[\s*\{[^}]*"baseUrl"\s*:\s*"([^"]+)"/,
    // Direct baseUrl pattern
    /"baseUrl"\s*:\s*"(https:\/\/www\.youtube\.com\/api\/timedtext[^"]+)"/,
    // Escaped version
    /"baseUrl":"(https:\\\/\\\/www\.youtube\.com\\\/api\\\/timedtext[^"]+)"/,
    // Alternative pattern
    /timedtext[^"]*videoId[^"]*":\s*"([^"]+)"/,
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) {
      let url = match[1]
        .replace(/\\u0026/g, '&')
        .replace(/\\\//g, '/')
        .replace(/\\"/g, '"')
      
      // Make sure it's a full URL
      if (!url.startsWith('http')) {
        url = 'https://www.youtube.com' + url
      }
      
      return url
    }
  }
  
  return null
}

/**
 * Parse YouTube caption XML/JSON into segments
 */
function parseTranscriptXml(data) {
  const segments = []
  
  // Try XML format first
  const xmlRegex = /<text[^>]*start="([\d.]+)"[^>]*(?:dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/gi
  let match
  
  while ((match = xmlRegex.exec(data)) !== null) {
    const start = parseFloat(match[1])
    const duration = match[2] ? parseFloat(match[2]) : 3
    let text = match[3]
    
    text = decodeHtmlEntities(text)
      .replace(/<[^>]+>/g, '')
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

  // If no XML matches, try JSON format
  if (segments.length === 0) {
    try {
      const json = JSON.parse(data)
      if (json.events) {
        for (const event of json.events) {
          if (event.segs) {
            const text = event.segs.map(s => s.utf8).join('').trim()
            if (text) {
              segments.push({
                start: event.tStartMs / 1000,
                duration: (event.dDurationMs || 3000) / 1000,
                end: (event.tStartMs + (event.dDurationMs || 3000)) / 1000,
                text
              })
            }
          }
        }
      }
    } catch (e) {
      // Not JSON, that's okay
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
  
  result = result.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
  result = result.replace(/&#x([a-fA-F0-9]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
  
  return result
}

/**
 * Full client-side video processing
 */
export async function processVideoClient(videoId) {
  const videoInfo = await getVideoInfo(videoId)
  const transcript = await fetchTranscriptClient(videoId)
  
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

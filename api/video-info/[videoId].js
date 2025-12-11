// Vercel Serverless Function for fetching YouTube video info

export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  const url = new URL(request.url)
  const videoId = url.pathname.split('/').pop()

  if (!videoId || videoId.length !== 11) {
    return new Response(
      JSON.stringify({ error: 'Invalid video ID' }),
      { status: 400, headers: corsHeaders() }
    )
  }

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    )

    if (!response.ok) {
      throw new Error('Video not found')
    }

    const data = await response.json()

    return new Response(
      JSON.stringify({
        videoId,
        title: data.title,
        author: data.author_name,
        authorUrl: data.author_url,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      }),
      { status: 200, headers: corsHeaders() }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        videoId,
        title: `Video ${videoId}`,
        author: 'Unknown',
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      }),
      { status: 200, headers: corsHeaders() }
    )
  }
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}


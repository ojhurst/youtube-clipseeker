import { Link } from 'react-router-dom'
import { BUILD_NUMBER } from '../config/build'

const changelog = [
  {
    version: 'Build 18',
    date: 'December 10, 2025 • 7:55 PM MST',
    title: 'Improved Transcript Fetching',
    changes: [
      'Added 3 different methods to fetch transcripts',
      'Method 1: Direct timedtext API with multiple language codes',
      'Method 2: Parse video page for caption tracks',
      'Method 3: Innertube API extraction',
      'Better error logging to diagnose issues',
      'Tries all methods before giving up',
    ],
    type: 'fix'
  },
  {
    version: 'Build 17',
    date: 'December 10, 2025 • 7:52 PM MST',
    title: 'Changelog Footer Update',
    changes: [
      'Replaced footer text with big "Back to Home" button',
      'Cleaner changelog page layout',
    ],
    type: 'improvement'
  },
  {
    version: 'Build 16',
    date: 'December 10, 2025 • 7:49 PM MST',
    title: 'Timestamp Fix + Privacy Update',
    changes: [
      'Corrected all timestamps to Mountain Standard Time (MST)',
      'Removed all external repository links for privacy',
      'Changelog now shows accurate build times',
    ],
    type: 'improvement'
  },
  {
    version: 'Build 15',
    date: 'December 10, 2025 • 7:45 PM MST',
    title: 'Changelog Timestamps',
    changes: [
      'Added timestamps to all changelog entries',
      'Retroactively added times to all previous builds',
      'Will include timestamps on all future updates',
    ],
    type: 'improvement'
  },
  {
    version: 'Build 14',
    date: 'December 10, 2025 • 7:30 PM MST',
    title: 'Mobile Video Detail Fix',
    changes: [
      'Video detail page now scrolls to top on load (shows player first)',
      'Mobile: floating "Jump to match" button instead of auto-scrolling',
      'Desktop: auto-scroll delayed to 1.5s so user sees video first',
      'Better mobile UX - no more scrolling up to find the player',
    ],
    type: 'fix'
  },
  {
    version: 'Build 13',
    date: 'December 10, 2025 • 7:15 PM MST',
    title: 'Smart Input Box',
    changes: [
      'Main input now handles both URL paste AND transcript search',
      'Automatically detects if input is a YouTube URL or search query',
      'Search dropdown appears inline for quick results',
      'Dynamic icon changes based on input mode',
      'Updated placeholder: "Paste a YouTube URL or search transcripts..."',
    ],
    type: 'feature'
  },
  {
    version: 'Build 12',
    date: 'December 10, 2025 • 7:00 PM MST',
    title: 'Footer Cleanup',
    changes: [
      'Removed GitHub link from footer',
      'Cleaner footer with just Changelog link and build version',
    ],
    type: 'improvement'
  },
  {
    version: 'Build 11',
    date: 'December 10, 2025 • 6:45 PM MST',
    title: 'Single Video Mode + Rate Limiting',
    changes: [
      'Simplified to single video uploads only (no more channel imports)',
      '5-minute cooldown between adding videos to prevent abuse',
      'Cleaner, simpler UI focused on individual videos',
      'Each user can add videos using their own residential IP',
    ],
    type: 'feature'
  },
  {
    version: 'Build 10',
    date: 'December 10, 2025 • 6:30 PM MST',
    title: 'Client-Side Transcript Fetching',
    changes: [
      'Transcripts now fetched from user\'s browser, not server',
      'Each user uses their own IP - YouTube won\'t block residential IPs',
      'CORS proxy approach to fetch directly from YouTube',
      'Server-side fallback if client-side fails',
      '1000 users = 1000 different IPs instead of one blocked cloud IP',
    ],
    type: 'feature'
  },
  {
    version: 'Build 9',
    date: 'December 10, 2025 • 6:00 PM MST',
    title: 'Railway Python Backend',
    changes: [
      'Deployed Python transcript backend to Railway',
      'FastAPI with youtube-transcript-api library',
      'Better error handling for YouTube blocking',
      'Fallback architecture for reliability',
    ],
    type: 'feature'
  },
  {
    version: 'Build 8',
    date: 'December 10, 2025 • 5:30 PM MST',
    title: 'Vercel API Improvements',
    changes: [
      'Enhanced Vercel serverless functions',
      'Better error messages for transcript failures',
      'Video info fallback to oEmbed API',
    ],
    type: 'improvement'
  },
  {
    version: 'Build 7',
    date: 'December 10, 2025 • 5:00 PM MST',
    title: 'Alternative Transcript API',
    changes: [
      'New approach using YouTube\'s internal transcript API',
      'Multiple fallback methods for transcript extraction',
      'Better compatibility with Vercel edge runtime',
      'Parses both timedtext XML and internal API JSON formats',
    ],
    type: 'improvement'
  },
  {
    version: 'Build 6',
    date: 'December 10, 2025 • 4:30 PM MST',
    title: 'Footer & Changelog',
    changes: [
      'Added footer with navigation links',
      'New Changelog page with full version history',
      'Timeline layout with color-coded badges',
    ],
    type: 'feature'
  },
  {
    version: 'Build 5',
    date: 'December 10, 2025 • 4:00 PM MST',
    title: 'Transcript Extraction Fix',
    changes: [
      'Simplified regex pattern for finding caption URLs',
      'Fixed issue where transcripts weren\'t being detected on Vercel',
      'Better handling of YouTube page structure variations',
    ],
    type: 'fix'
  },
  {
    version: 'Build 4',
    date: 'December 10, 2025 • 3:30 PM MST',
    title: 'Mobile Optimization',
    changes: [
      'Full mobile-responsive search dropdown',
      'Smaller, touch-friendly header on mobile',
      'Video cards optimized for mobile screens',
      'YouTube button always visible on touch devices',
      'Improved tap targets throughout the app',
    ],
    type: 'feature'
  },
  {
    version: 'Build 3',
    date: 'December 10, 2025 • 3:00 PM MST',
    title: 'Build Number Display',
    changes: [
      'Added version indicator in header',
      'Easy deployment verification',
    ],
    type: 'feature'
  },
  {
    version: 'Build 2',
    date: 'December 10, 2025 • 2:30 PM MST',
    title: 'Enhanced Transcript Extraction',
    changes: [
      'Multiple regex patterns for caption URL detection',
      'JSON parsing fallback for transcript data',
      'Better error messages for debugging',
      'Support for both XML and JSON caption formats',
    ],
    type: 'improvement'
  },
  {
    version: 'Build 1',
    date: 'December 10, 2025 • 2:00 PM MST',
    title: 'Vercel API Routing Fix',
    changes: [
      'Fixed SPA rewrite interfering with API routes',
      'API endpoints now properly accessible',
    ],
    type: 'fix'
  },
  {
    version: '1.0.0',
    date: 'December 10, 2025 • 1:00 PM MST',
    title: 'Cloud Migration Feature',
    changes: [
      'Local IndexedDB to Supabase migration',
      'Migration banner on homepage',
      'One-click data transfer to cloud',
    ],
    type: 'feature'
  },
  {
    version: '0.9.0',
    date: 'December 10, 2025 • 12:00 PM MST',
    title: 'Supabase Integration',
    changes: [
      'Supabase CLI configuration',
      'Database migrations setup',
      'Ready for cloud deployment',
    ],
    type: 'feature'
  },
  {
    version: '0.1.0',
    date: 'December 10, 2025 • 10:00 AM MST',
    title: 'Initial Release',
    changes: [
      'YouTube video transcript extraction',
      'Full-text search across all transcripts',
      'Instant search dropdown with highlighted snippets',
      'Channel bulk import (Last 5 or Entire Channel)',
      'Video detail page with embedded player',
      'Timestamp-based navigation',
      'IndexedDB local storage',
      'Supabase cloud storage support',
      'Vercel serverless API functions',
      'Responsive dark theme UI',
      'Failed video retry system',
    ],
    type: 'release'
  },
]

const typeColors = {
  release: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  feature: 'bg-green-500/20 text-green-400 border-green-500/30',
  improvement: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  fix: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const typeLabels = {
  release: 'Release',
  feature: 'Feature',
  improvement: 'Improvement',
  fix: 'Bug Fix',
}

export default function Changelog() {
  return (
    <div className="min-h-screen bg-charcoal-950 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-charcoal-400 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to ClipSeeker
          </Link>
          
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            Changelog
          </h1>
          <p className="text-charcoal-400">
            Track all updates and improvements to ClipSeeker.
            Currently on <span className="text-yt-red font-mono">Build {BUILD_NUMBER}</span>
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-charcoal-800" />

          {/* Entries */}
          <div className="space-y-8">
            {changelog.map((entry, index) => (
              <div key={index} className="relative pl-8">
                {/* Dot */}
                <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${
                  index === 0 
                    ? 'bg-yt-red border-yt-red' 
                    : 'bg-charcoal-900 border-charcoal-700'
                }`} />

                {/* Content */}
                <div className="bg-charcoal-900/50 border border-charcoal-800 rounded-xl p-5 hover:border-charcoal-700 transition-colors">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${typeColors[entry.type]}`}>
                      {typeLabels[entry.type]}
                    </span>
                    <span className="text-sm font-mono text-charcoal-500">
                      {entry.version}
                    </span>
                  </div>
                  
                  {/* Date & Time */}
                  <div className="flex items-center gap-2 mb-3 text-sm text-charcoal-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{entry.date}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {entry.title}
                  </h3>

                  {/* Changes */}
                  <ul className="space-y-1.5">
                    {entry.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-charcoal-300">
                        <svg className="w-4 h-4 text-yt-red mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-yt-red hover:bg-yt-dark-red text-white font-medium rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { BUILD_NUMBER } from '../config/build'

const changelog = [
  {
    version: 'Build 15',
    date: 'December 10, 2025 • 11:45 PM',
    hash: 'pending',
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
    date: 'December 10, 2025 • 11:30 PM',
    hash: '359ae5a',
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
    date: 'December 10, 2025 • 11:15 PM',
    hash: 'eb75d7b',
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
    date: 'December 10, 2025 • 11:00 PM',
    hash: 'b58b9e0',
    title: 'Footer Cleanup',
    changes: [
      'Removed GitHub link from footer',
      'Cleaner footer with just Changelog link and build version',
    ],
    type: 'improvement'
  },
  {
    version: 'Build 11',
    date: 'December 10, 2025 • 10:45 PM',
    hash: 'cc8e14e',
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
    date: 'December 10, 2025 • 10:30 PM',
    hash: '603f966',
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
    date: 'December 10, 2025 • 10:00 PM',
    hash: 'f753f6c',
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
    date: 'December 10, 2025 • 9:30 PM',
    hash: '3111ab0',
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
    date: 'December 10, 2025 • 9:00 PM',
    hash: 'b33bde3',
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
    date: 'December 10, 2025 • 8:30 PM',
    hash: 'e29f6db',
    title: 'Footer & Changelog',
    changes: [
      'Added footer with navigation links',
      'New Changelog page with full version history',
      'Timeline layout with color-coded badges',
      'GitHub integration with commit links',
    ],
    type: 'feature'
  },
  {
    version: 'Build 5',
    date: 'December 10, 2025 • 8:00 PM',
    hash: '34fccb4',
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
    date: 'December 10, 2025 • 7:30 PM',
    hash: '1c9cd46',
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
    date: 'December 10, 2025 • 7:00 PM',
    hash: '05f7b19',
    title: 'Build Number Display',
    changes: [
      'Added version indicator in header',
      'Easy deployment verification',
    ],
    type: 'feature'
  },
  {
    version: 'Build 2',
    date: 'December 10, 2025 • 6:30 PM',
    hash: 'a11d259',
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
    date: 'December 10, 2025 • 6:00 PM',
    hash: '8528286',
    title: 'Vercel API Routing Fix',
    changes: [
      'Fixed SPA rewrite interfering with API routes',
      'API endpoints now properly accessible',
    ],
    type: 'fix'
  },
  {
    version: '1.0.0',
    date: 'December 10, 2025 • 5:00 PM',
    hash: '25a08b8',
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
    date: 'December 10, 2025 • 4:00 PM',
    hash: 'acd0706',
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
    date: 'December 10, 2025 • 12:00 PM',
    hash: '0253947',
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
              <div key={entry.hash} className="relative pl-8">
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
                    <span className="text-charcoal-600">•</span>
                    <a 
                      href={`https://github.com/ojhurst/youtube-clipseeker/commit/${entry.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-charcoal-600 hover:text-yt-red transition-colors"
                    >
                      {entry.hash.substring(0, 7)}
                    </a>
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
        <div className="mt-12 text-center text-sm text-charcoal-600">
          <p>All times shown in local timezone</p>
        </div>
      </div>
    </div>
  )
}

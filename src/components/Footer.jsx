import { Link } from 'react-router-dom'
import { BUILD_VERSION } from '../config/build'

export default function Footer() {
  return (
    <footer className="bg-charcoal-950 border-t border-charcoal-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          {/* Top row: Brand + Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3 sm:gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2 text-charcoal-500">
              <div className="w-6 h-6 bg-gradient-to-br from-yt-red to-yt-dark-red rounded-md flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <span className="text-sm font-medium">ClipSeeker</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-4 sm:gap-6 text-sm">
              <Link 
                to="/changelog" 
                className="text-charcoal-500 hover:text-yt-red active:text-yt-red transition-colors"
              >
                Changelog
              </Link>
            </div>
          </div>

          {/* Build Info - always visible, red on mobile */}
          <div className="text-xs text-yt-red font-mono">
            {BUILD_VERSION}
          </div>
        </div>
      </div>
    </footer>
  )
}

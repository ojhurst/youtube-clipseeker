import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'
import SearchDropdown from './SearchDropdown'
import { BUILD_VERSION } from '../config/build'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { search, searchQuery, searchResults, videos } = useStore()
  const [localQuery, setLocalQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchRef = useRef(null)
  const inputRef = useRef(null)

  // Sync local query with store
  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // Debounced search
  const debounceRef = useRef(null)
  const handleInputChange = useCallback((e) => {
    const value = e.target.value
    setLocalQuery(value)
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        search(value)
        setShowDropdown(true)
      } else {
        setShowDropdown(false)
      }
    }, 150)
  }, [search])

  const handleSearch = (e) => {
    e.preventDefault()
    if (localQuery.trim()) {
      search(localQuery)
      navigate(`/search?q=${encodeURIComponent(localQuery)}`)
      setShowDropdown(false)
      inputRef.current?.blur()
    }
  }

  const handleFocus = () => {
    setIsSearchFocused(true)
    if (localQuery.trim().length >= 2 && searchResults.length > 0) {
      setShowDropdown(true)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false)
      inputRef.current?.blur()
    }
  }

  const clearSearch = () => {
    setLocalQuery('')
    search('')
    setShowDropdown(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-charcoal-950/95 backdrop-blur-md border-b border-charcoal-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo - Compact on mobile */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yt-red to-yt-dark-red rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-charcoal-900 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 sm:w-3 sm:h-3 text-yt-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-bold text-lg text-white tracking-tight">
                ClipSeeker
              </h1>
              <p className="text-[10px] text-charcoal-400 -mt-1 tracking-wide">
                FIND THE EXACT MOMENT
              </p>
            </div>
          </Link>

          {/* Search Bar - Takes priority on mobile */}
          <div ref={searchRef} className="flex-1 max-w-xl relative">
            <form onSubmit={handleSearch}>
              <div className={`relative transition-all ${isSearchFocused ? 'sm:scale-[1.02]' : ''}`}>
                <input
                  ref={inputRef}
                  type="text"
                  value={localQuery}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 100)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search transcripts..."
                  className={`w-full bg-charcoal-900 border rounded-lg sm:rounded-xl py-2 sm:py-2.5 px-3 sm:px-4 pl-9 sm:pl-11 text-sm sm:text-base text-white placeholder-charcoal-500 focus:outline-none transition-all ${
                    showDropdown 
                      ? 'border-yt-red/50 ring-2 ring-yt-red/20 rounded-b-none' 
                      : 'border-charcoal-700 focus:border-yt-red/50 focus:ring-2 focus:ring-yt-red/20'
                  }`}
                />
                <svg className={`absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                  isSearchFocused || showDropdown ? 'text-yt-red' : 'text-charcoal-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                
                {localQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-white active:text-yt-red transition-colors p-1.5 -m-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </form>

            {/* Search Dropdown */}
            {showDropdown && (
              <SearchDropdown 
                results={searchResults} 
                query={localQuery}
                onClose={() => setShowDropdown(false)}
              />
            )}
          </div>

          {/* Navigation - Compact on mobile */}
          <nav className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Link
              to="/library"
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === '/library'
                  ? 'bg-yt-red/10 text-yt-red'
                  : 'text-charcoal-300 hover:text-white active:text-yt-red hover:bg-charcoal-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="hidden sm:inline">Library</span>
              {videos.length > 0 && (
                <span className="bg-charcoal-700 text-charcoal-200 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {videos.length}
                </span>
              )}
            </Link>
            
            {/* Build Number - Desktop only */}
            <span className="hidden lg:block text-[10px] text-yt-red font-mono ml-2 opacity-60">
              {BUILD_VERSION}
            </span>
          </nav>
        </div>
      </div>
    </header>
  )
}

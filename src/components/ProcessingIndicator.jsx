import { useStore } from '../store/useStore'
import { getYouTubeThumbnail } from '../services/youtubeUtils'

export default function ProcessingIndicator() {
  const { processingProgress } = useStore()
  const { current, total, currentTitle, currentId, batch, totalBatches, phase, skippedCount, successCount, failCount, lastError } = processingProgress

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  const thumbnailUrl = currentId ? getYouTubeThumbnail(currentId, 'mqdefault') : null

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-2xl shadow-2xl overflow-hidden min-w-[340px] max-w-[420px]">
        {/* Thumbnail Preview - only during processing */}
        {thumbnailUrl && phase === 'processing' && (
          <div className="relative h-36 overflow-hidden">
            <img 
              src={thumbnailUrl} 
              alt="Processing video"
              className="w-full h-full object-cover"
              key={currentId}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/60 to-transparent" />
            
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            
            {/* Video counter */}
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-xs font-medium text-white">
              Video {current} of {total}
            </div>
            
            {/* Batch badge */}
            {batch && totalBatches && totalBatches !== '?' && (
              <div className="absolute top-3 right-12 px-2.5 py-1 bg-yt-red backdrop-blur-sm rounded-lg text-xs font-bold text-white">
                Batch {batch}/{totalBatches}
              </div>
            )}
            
            {/* Spinner */}
            <div className="absolute top-3 right-3">
              <div className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-yt-red animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
            
            {/* Success/Fail counters */}
            {(successCount > 0 || failCount > 0) && (
              <div className="absolute bottom-3 left-3 flex gap-2">
                {successCount > 0 && (
                  <span className="px-2 py-1 bg-green-500/80 backdrop-blur-sm rounded text-xs font-medium text-white">
                    ✓ {successCount}
                  </span>
                )}
                {failCount > 0 && (
                  <span className="px-2 py-1 bg-red-500/80 backdrop-blur-sm rounded text-xs font-medium text-white">
                    ✗ {failCount}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Fetching phase header */}
        {phase === 'fetching' && (
          <div className="relative h-28 bg-gradient-to-br from-charcoal-800 to-charcoal-900 flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <svg className="w-10 h-10 text-yt-red animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-sm text-white font-medium mt-2">Scanning Channel</p>
            </div>
            
            {/* Batch indicator */}
            {batch && (
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-charcoal-700 rounded-lg text-xs font-medium text-charcoal-300">
                Scan #{batch}
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="p-4">
          {/* Fetching phase info */}
          {phase === 'fetching' && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-white">
                  {currentTitle || 'Scanning channel...'}
                </p>
                {total > 0 && (
                  <p className="text-lg font-display font-bold text-yt-red mt-1">
                    {total} videos found
                  </p>
                )}
              </div>
              
              {/* Indeterminate progress */}
              <div className="relative h-2 bg-charcoal-800 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yt-red to-transparent animate-shimmer" />
              </div>
              
              <p className="text-xs text-charcoal-500">
                Looking for more videos...
              </p>
            </div>
          )}

          {/* Processing phase info */}
          {phase === 'processing' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Processing video {current} of {total}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {batch && totalBatches && totalBatches !== '?' && (
                      <span className="text-xs text-charcoal-400">
                        Batch {batch}/{totalBatches}
                      </span>
                    )}
                    {(successCount > 0 || failCount > 0) && (
                      <span className="text-xs text-charcoal-500">
                        • {successCount} added, {failCount} failed
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-display font-bold text-yt-red">
                    {percentage}%
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-2.5 bg-charcoal-800 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-yt-red to-red-400 rounded-full transition-all duration-300 progress-glow"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center text-xs text-charcoal-500">
                <span className="truncate max-w-[200px]">{currentTitle || 'Processing...'}</span>
                <span>{total - current} remaining</span>
              </div>
              
              {/* Last error */}
              {lastError && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400 truncate" title={lastError}>
                    Last error: {lastError.substring(0, 60)}...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

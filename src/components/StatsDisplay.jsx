export default function StatsDisplay({ stats }) {
  if (!stats || stats.totalVideos === 0) {
    return null
  }

  // Format hours nicely
  const formatHours = (totalSeconds) => {
    const hours = totalSeconds / 3600
    if (hours < 1) {
      const mins = Math.round(totalSeconds / 60)
      return `${mins}m`
    }
    if (hours < 10) {
      return `${hours.toFixed(1)}h`
    }
    return `${Math.round(hours)}h`
  }

  return (
    <div className="mt-12 animate-fade-in">
      <div className="flex flex-wrap items-center justify-center gap-8 text-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-charcoal-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-yt-red" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-2xl font-display font-bold text-white">
              {stats.totalVideos}
            </p>
            <p className="text-xs text-charcoal-500 uppercase tracking-wide">
              Videos
            </p>
          </div>
        </div>

        {stats.totalDuration > 0 && (
          <>
            <div className="w-px h-10 bg-charcoal-700 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-charcoal-800 flex items-center justify-center">
                <svg className="w-5 h-5 text-yt-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-2xl font-display font-bold text-white">
                  {formatHours(stats.totalDuration)}
                </p>
                <p className="text-xs text-charcoal-500 uppercase tracking-wide">
                  Searchable
                </p>
              </div>
            </div>
          </>
        )}

        {stats.totalChannels > 0 && (
          <>
            <div className="w-px h-10 bg-charcoal-700 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-charcoal-800 flex items-center justify-center">
                <svg className="w-5 h-5 text-yt-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-2xl font-display font-bold text-white">
                  {stats.totalChannels}
                </p>
                <p className="text-xs text-charcoal-500 uppercase tracking-wide">
                  Channels
                </p>
              </div>
            </div>
          </>
        )}

        {stats.totalFailed > 0 && (
          <>
            <div className="w-px h-10 bg-charcoal-700 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-charcoal-800 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-2xl font-display font-bold text-white">
                  {stats.totalFailed}
                </p>
                <p className="text-xs text-charcoal-500 uppercase tracking-wide">
                  Skipped
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

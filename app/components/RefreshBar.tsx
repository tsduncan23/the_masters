'use client'

interface RefreshBarProps {
  lastUpdated: string | null
  countdown: number
  onRefresh: () => void
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })
}

export default function RefreshBar({ lastUpdated, countdown, onRefresh }: RefreshBarProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-green-200">
      {lastUpdated && (
        <span>Updated {formatTime(lastUpdated)}</span>
      )}
      <span>· Refreshing in {countdown}s</span>
      <button
        onClick={onRefresh}
        className="px-2 py-0.5 rounded border border-green-300 text-green-100 hover:bg-green-700 transition-colors text-xs"
      >
        Refresh now
      </button>
    </div>
  )
}

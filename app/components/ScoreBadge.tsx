import type { GolferStatus } from '@/lib/types'

interface ScoreBadgeProps {
  score: number | null
  status?: GolferStatus
  className?: string
}

export default function ScoreBadge({ score, status, className = '' }: ScoreBadgeProps) {
  if (status === 'cut') {
    return <span className={`text-gray-400 text-sm font-medium ${className}`}>CUT</span>
  }
  if (status === 'wd') {
    return <span className={`text-gray-400 text-sm font-medium ${className}`}>WD</span>
  }
  if (score === null) {
    return <span className={`text-gray-400 text-sm ${className}`}>--</span>
  }
  if (score === 0) {
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-sm font-bold bg-gray-100 text-gray-700 ${className}`}>
        E
      </span>
    )
  }
  if (score < 0) {
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-sm font-bold bg-red-100 text-red-700 ${className}`}>
        {score}
      </span>
    )
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-sm font-bold bg-green-100 text-green-800 ${className}`}>
      +{score}
    </span>
  )
}

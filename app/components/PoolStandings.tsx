import type { TeamScore, GolferStatus } from '@/lib/types'
import ScoreBadge from './ScoreBadge'

interface PoolStandingsProps {
  standings: TeamScore[]
  loading: boolean
  projectedCutScore: number | null
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      <td className="px-3 py-3"><div className="h-4 w-6 bg-gray-200 rounded" /></td>
      <td className="px-3 py-3"><div className="h-4 w-28 bg-gray-200 rounded" /></td>
      <td className="px-3 py-3"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <td key={i} className="px-3 py-3"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
      ))}
    </tr>
  )
}

type CutStatus = 'safe' | 'bubble' | 'out' | null

function getCutStatus(
  score: number | null,
  status: GolferStatus,
  projectedCutScore: number | null,
): CutStatus {
  if (projectedCutScore === null) return null
  if (status === 'cut' || status === 'wd' || status === 'pending') return null
  if (score === null) return null
  if (score <= projectedCutScore) return 'safe'
  if (score <= projectedCutScore + 2) return 'bubble'  // within 2 strokes of the cut line
  return 'out'
}

const CUT_BG: Record<NonNullable<CutStatus>, string> = {
  safe:   'bg-green-50  border-l-2 border-green-400',
  bubble: 'bg-yellow-50 border-l-2 border-yellow-400',
  out:    'bg-red-50    border-l-2 border-red-400',
}

function GolferCell({
  golfer,
  projectedCutScore,
}: {
  golfer: TeamScore['golfers'][0]
  projectedCutScore: number | null
}) {
  const muted = !golfer.counting
  const cutStatus = getCutStatus(golfer.score, golfer.status, projectedCutScore)
  const cutBg = cutStatus ? CUT_BG[cutStatus] : ''

  return (
    <td className={`px-2 py-2 min-w-[95px] ${cutBg} ${muted ? 'opacity-50' : ''}`}>
      <div className="flex flex-col gap-0.5">
        <span className={`text-xs font-medium leading-tight block truncate max-w-[85px] ${muted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {golfer.name}
        </span>
        <div className="flex items-center gap-1">
          <ScoreBadge score={golfer.score} status={golfer.status} />
          {golfer.thru !== '--' && golfer.thru !== 'F' && golfer.status === 'active' && (
            <span className="text-gray-400 text-xs">({golfer.thru})</span>
          )}
          {golfer.thru === 'F' && (
            <span className="text-gray-400 text-xs">F</span>
          )}
        </div>
      </div>
    </td>
  )
}

export default function PoolStandings({ standings, loading, projectedCutScore }: PoolStandingsProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '504px' }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-masters-green text-white text-left">
              <th className="px-3 py-3 font-semibold w-10">#</th>
              <th className="px-3 py-3 font-semibold w-36">Participant</th>
              <th className="px-3 py-3 font-semibold w-16 text-center">Total</th>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <th key={n} className="px-2 py-3 font-semibold text-green-200 text-xs">
                  Pick {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && standings.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : standings.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-400">
                  No pool data available yet
                </td>
              </tr>
            ) : (
              standings.map((team, i) => (
                <tr
                  key={team.participantName}
                  className={`border-b border-gray-100 hover:bg-masters-light transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="px-3 py-2 text-gray-600 font-bold text-center">{team.rank}</td>
                  <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">{team.participantName}</td>
                  <td className="px-3 py-2 text-center">
                    {team.teamTotal !== null ? (
                      <ScoreBadge score={team.teamTotal} />
                    ) : (
                      <span className="text-gray-400 text-sm">--</span>
                    )}
                  </td>
                  {team.golfers.map((g, gi) => (
                    <GolferCell key={gi} golfer={g} projectedCutScore={projectedCutScore} />
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
        <span>Best 5 of 6 count toward total. Struck-through = dropped score.</span>
        {projectedCutScore !== null && (
          <span className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-sm bg-green-400" /> Inside cut
            <span className="inline-block w-2 h-2 rounded-sm bg-yellow-400" /> Within 2 of cut
            <span className="inline-block w-2 h-2 rounded-sm bg-red-400" /> Outside cut
          </span>
        )}
      </div>
    </div>
  )
}

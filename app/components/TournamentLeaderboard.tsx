import type { GolferResult } from '@/lib/types'
import ScoreBadge from './ScoreBadge'

interface TournamentLeaderboardProps {
  golfers: GolferResult[]
  loading: boolean
  projectedCutScore: number | null
}

function formatCutScore(score: number): string {
  if (score === 0) return 'E'
  return score > 0 ? `+${score}` : `${score}`
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      <td className="px-3 py-3"><div className="h-4 w-8 bg-gray-200 rounded" /></td>
      <td className="px-3 py-3"><div className="h-4 w-36 bg-gray-200 rounded" /></td>
      <td className="px-3 py-3"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
      <td className="px-3 py-3"><div className="h-4 w-10 bg-gray-200 rounded" /></td>
      {[0, 1, 2, 3].map(i => (
        <td key={i} className="px-3 py-3"><div className="h-4 w-8 bg-gray-200 rounded" /></td>
      ))}
    </tr>
  )
}

export default function TournamentLeaderboard({ golfers, loading, projectedCutScore }: TournamentLeaderboardProps) {
  const active = golfers.filter(g => g.status !== 'cut' && g.status !== 'wd')
  const eliminated = golfers.filter(g => g.status === 'cut' || g.status === 'wd')

  // Index of first active player outside the projected cut
  const cutLineIdx = projectedCutScore !== null
    ? active.findIndex(g => g.score !== null && g.score > projectedCutScore)
    : -1

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Projected cut badge */}
      {projectedCutScore !== null && (
        <div className="px-3 py-2 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <span className="text-red-500 text-sm">✂</span>
          <span className="text-xs font-semibold text-red-700">
            Projected Cut: {formatCutScore(projectedCutScore)}
          </span>
          <span className="text-xs text-red-500">— Top 50 advance to the weekend</span>
        </div>
      )}

      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: projectedCutScore !== null ? '472px' : '504px' }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-masters-green text-white text-left">
              <th className="px-3 py-3 font-semibold w-14">Pos</th>
              <th className="px-3 py-3 font-semibold">Player</th>
              <th className="px-3 py-3 font-semibold w-16 text-center">Score</th>
              <th className="px-3 py-3 font-semibold w-14 text-center">Thru</th>
              <th className="px-3 py-3 font-semibold w-12 text-center">R1</th>
              <th className="px-3 py-3 font-semibold w-12 text-center">R2</th>
              <th className="px-3 py-3 font-semibold w-12 text-center">R3</th>
              <th className="px-3 py-3 font-semibold w-12 text-center">R4</th>
            </tr>
          </thead>
          <tbody>
            {loading && golfers.length === 0 ? (
              Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} />)
            ) : (
              <>
                {active.map((g, i) => (
                  <>
                    {/* Cut line separator — inserted before first player outside cut */}
                    {cutLineIdx !== -1 && i === cutLineIdx && (
                      <tr key={`cut-line`}>
                        <td colSpan={8} className="px-3 py-1 bg-red-50 border-y border-red-300 text-center">
                          <span className="text-xs font-semibold text-red-600 tracking-wide">
                            ✂ PROJECTED CUT — {formatCutScore(projectedCutScore!)}
                          </span>
                        </td>
                      </tr>
                    )}
                    <tr
                      key={g.id}
                      className={`border-b border-gray-100 hover:bg-masters-light transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-3 py-2.5 text-gray-600 font-medium">{g.position}</td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900">{g.name}</td>
                      <td className="px-3 py-2.5 text-center">
                        <ScoreBadge score={g.score} status={g.status} />
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{g.thru}</td>
                      {g.rounds.map((r, ri) => (
                        <td key={ri} className="px-3 py-2.5 text-center text-gray-600">{r}</td>
                      ))}
                    </tr>
                  </>
                ))}
                {eliminated.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={8} className="px-3 py-1.5 bg-gray-100 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                        Missed Cut / Withdrew
                      </td>
                    </tr>
                    {eliminated.map((g) => (
                      <tr key={g.id} className="border-b border-gray-100 bg-gray-50 opacity-60">
                        <td className="px-3 py-2 text-gray-400">{g.position}</td>
                        <td className="px-3 py-2 text-gray-500">{g.name}</td>
                        <td className="px-3 py-2 text-center">
                          <ScoreBadge score={g.score} status={g.status} />
                        </td>
                        <td className="px-3 py-2 text-center text-gray-400">{g.thru}</td>
                        {g.rounds.map((r, ri) => (
                          <td key={ri} className="px-3 py-2 text-center text-gray-400">{r}</td>
                        ))}
                      </tr>
                    ))}
                  </>
                )}
                {!loading && golfers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-gray-400">
                      No leaderboard data available yet
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

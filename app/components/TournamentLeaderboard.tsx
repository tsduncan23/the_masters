import type { GolferResult } from '@/lib/types'
import ScoreBadge from './ScoreBadge'

interface TournamentLeaderboardProps {
  golfers: GolferResult[]
  loading: boolean
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

export default function TournamentLeaderboard({ golfers, loading }: TournamentLeaderboardProps) {
  const active = golfers.filter(g => g.status !== 'cut' && g.status !== 'wd')
  const eliminated = golfers.filter(g => g.status === 'cut' || g.status === 'wd')

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
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
                ))}
                {eliminated.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={8} className="px-3 py-1.5 bg-gray-100 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                        Missed Cut / Withdrew
                      </td>
                    </tr>
                    {eliminated.map((g, i) => (
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

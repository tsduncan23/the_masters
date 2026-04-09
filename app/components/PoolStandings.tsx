import type { TeamScore } from '@/lib/types'
import ScoreBadge from './ScoreBadge'

interface PoolStandingsProps {
  standings: TeamScore[]
  loading: boolean
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

function GolferCell({ golfer }: { golfer: TeamScore['golfers'][0] }) {
  const muted = !golfer.counting

  return (
    <td className={`px-2 py-2 min-w-[120px] ${muted ? 'opacity-40' : ''}`}>
      <div className="flex flex-col gap-0.5">
        <span className={`text-xs font-medium leading-tight ${muted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
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

export default function PoolStandings({ standings, loading }: PoolStandingsProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
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
                    <GolferCell key={gi} golfer={g} />
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        Best 5 of 6 golfers count toward team total. Struck-through golfer is the dropped score.
      </div>
    </div>
  )
}

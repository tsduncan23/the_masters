'use client'

import { useState, useEffect, useCallback } from 'react'
import TournamentLeaderboard from '@/components/TournamentLeaderboard'
import PoolStandings from '@/components/PoolStandings'
import RefreshBar from '@/components/RefreshBar'
import ScoreBadge from '@/components/ScoreBadge'
import type { ApiResponse, GolferResult, TeamScore } from '@/lib/types'

const REFRESH_INTERVAL = 15 // seconds

/** Top-50-including-ties cut rule. Returns null if cut already made or < 50 players scored. */
function getProjectedCutScore(golfers: GolferResult[]): number | null {
  if (golfers.some(g => g.status === 'cut')) return null  // cut already applied
  const withScores = golfers
    .filter(g => g.score !== null && g.status === 'active')
    .sort((a, b) => (a.score ?? 999) - (b.score ?? 999))
  if (withScores.length < 50) return null
  return withScores[49].score
}

function EntryDetail({ team, projectedCutScore }: { team: TeamScore; projectedCutScore: number | null }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-base">{team.participantName}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Team Total:</span>
          <ScoreBadge score={team.teamTotal} />
          <span className="text-xs text-gray-400">({team.scoringCount}/5 scoring)</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {team.golfers.map((g, i) => {
          const cutStatus =
            projectedCutScore !== null && g.score !== null && g.status === 'active'
              ? g.score <= projectedCutScore ? 'safe'
              : g.score <= projectedCutScore + 2 ? 'bubble'
              : 'out'
              : null
          const cutBorder =
            cutStatus === 'safe'   ? 'border-green-400 bg-green-50' :
            cutStatus === 'bubble' ? 'border-yellow-400 bg-yellow-50' :
            cutStatus === 'out'    ? 'border-red-400 bg-red-50' :
            g.counting             ? 'border-green-300 bg-green-50' :
                                     'border-gray-200 bg-gray-50'
          return (
          <div
            key={i}
            className={`rounded border px-3 py-2 ${cutBorder} ${!g.counting ? 'opacity-50' : ''}`}
          >
            <span
              className={`block text-xs font-semibold leading-tight mb-1 ${
                g.counting ? 'text-gray-800' : 'line-through text-gray-400'
              }`}
            >
              {g.name}
            </span>
            <ScoreBadge score={g.score} status={g.status} />
            {g.thru !== '--' && (
              <span className="block text-xs text-gray-400 mt-0.5">
                {g.thru === 'F' ? 'F' : `Thru ${g.thru}`}
              </span>
            )}
            {!g.counting && (
              <span className="block text-xs text-gray-400 italic">dropped</span>
            )}
          </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const [selectedParticipant, setSelectedParticipant] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard')
      const json: ApiResponse = await res.json()
      setData(json)
      if (json.error) setError(json.error)
      else setError(null)
    } catch {
      setError('Connection error. Will retry.')
    } finally {
      setLoading(false)
      setCountdown(REFRESH_INTERVAL)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Countdown + auto-refresh every 15s
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchData()
          return REFRESH_INTERVAL
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [fetchData])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const selectedTeam = data?.poolStandings.find(t => t.participantName === selectedParticipant)
  const projectedCutScore = data ? getProjectedCutScore(data.leaderboard) : null

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#F0F7F4' }}>
      {/* Header */}
      <header className="text-white shadow-lg" style={{ backgroundColor: '#006747' }}>
        <div className="max-w-screen-2xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">The Masters 2026</h1>
            {data?.tournamentName && data.tournamentName !== 'Masters Tournament' && (
              <p className="text-green-200 text-sm mt-0.5">Live: {data.tournamentName}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <RefreshBar
              lastUpdated={data?.lastUpdated ?? null}
              countdown={countdown}
              onRefresh={fetchData}
            />
            <button
              onClick={handleLogout}
              className="text-xs text-green-300 hover:text-white transition-colors underline"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-yellow-800 text-sm text-center">
          {error}
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-5">
        {/* Entry picker */}
        <section>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="font-semibold text-sm whitespace-nowrap" style={{ color: '#006747' }}>
              View Entry:
            </label>
            <select
              value={selectedParticipant}
              onChange={e => setSelectedParticipant(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">— Select a participant —</option>
              {(data?.poolStandings ?? []).map(t => (
                <option key={t.participantName} value={t.participantName}>
                  #{t.rank} {t.participantName} ({t.teamTotalDisplay})
                </option>
              ))}
            </select>
          </div>
          {selectedTeam && (
            <div className="mt-3">
              <EntryDetail team={selectedTeam} projectedCutScore={projectedCutScore} />
            </div>
          )}
        </section>

        {/* Two-column grid: leaderboard left, standings right */}
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 items-start min-w-0">
          {/* Tournament Leaderboard — left column */}
          <section className="min-w-0">
            <h2 className="text-lg font-bold mb-3" style={{ color: '#006747' }}>
              Tournament Leaderboard
            </h2>
            <TournamentLeaderboard golfers={data?.leaderboard ?? []} loading={loading} projectedCutScore={projectedCutScore} />
          </section>

          {/* Pool Standings — right column */}
          <section className="min-w-0">
            <h2 className="text-lg font-bold mb-3" style={{ color: '#006747' }}>
              Pool Standings
            </h2>
            <PoolStandings standings={data?.poolStandings ?? []} loading={loading} projectedCutScore={projectedCutScore} />
          </section>
        </div>
      </div>
    </main>
  )
}

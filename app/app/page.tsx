'use client'

import { useState, useEffect, useCallback } from 'react'
import TournamentLeaderboard from '@/components/TournamentLeaderboard'
import PoolStandings from '@/components/PoolStandings'
import RefreshBar from '@/components/RefreshBar'
import type { ApiResponse } from '@/lib/types'

const REFRESH_INTERVAL = 60 // seconds

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)

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

  // Countdown + auto-refresh every 60s
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

      <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-8">
        {/* Pool Standings first — that's what people care about */}
        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: '#006747' }}>
            Pool Standings
          </h2>
          <PoolStandings standings={data?.poolStandings ?? []} loading={loading} />
        </section>

        {/* Full Tournament Leaderboard */}
        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: '#006747' }}>
            Tournament Leaderboard
          </h2>
          <TournamentLeaderboard golfers={data?.leaderboard ?? []} loading={loading} />
        </section>
      </div>
    </main>
  )
}

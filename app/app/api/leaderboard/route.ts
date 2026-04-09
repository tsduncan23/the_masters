import { fetchESPNLeaderboard } from '@/lib/espn'
import { computeAllTeamScores } from '@/lib/pool'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { tournamentName, golfers } = await fetchESPNLeaderboard()
    const poolStandings = computeAllTeamScores(golfers)

    return Response.json({
      tournamentName,
      leaderboard: golfers,
      poolStandings,
      lastUpdated: new Date().toISOString(),
    })
  } catch (err) {
    console.error('ESPN fetch error:', err)
    return Response.json({
      tournamentName: 'Masters Tournament',
      leaderboard: [],
      poolStandings: [],
      lastUpdated: new Date().toISOString(),
      error: 'Failed to fetch live data. Retrying shortly.',
    })
  }
}

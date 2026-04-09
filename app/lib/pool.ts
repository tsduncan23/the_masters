import type { GolferResult, PoolGolferScore, TeamScore } from './types'
import { buildGolferMap, normalizeKey } from './espn'

interface PoolTeam {
  name: string
  golfers: string[]
}

const POOL_TEAMS: PoolTeam[] = [
  { name: 'Juan Diaz', golfers: ['Bryson DeChambeau', 'Jon Rahm', 'Sergio Garcia', 'Kurt Kitayama', 'Ryan Fox', 'Tom McKibbin'] },
  { name: 'Dave Finley', golfers: ['Xander Schauffele', 'Matt Fitzpatrick', 'Robert MacIntyre', 'Gary Woodland', 'Kurt Kitayama', 'Michael Kim'] },
  { name: 'Blake Gailen', golfers: ['Scottie Scheffler', 'Rory McIlroy', 'Jordan Spieth', 'Max Homa', 'Bubba Watson', 'Vijay Singh'] },
  { name: 'Ethan Levitt', golfers: ['Tommy Fleetwood', 'Jacob Bridgeman', 'Matt Fitzpatrick', 'Xander Schauffele', 'J.J. Spaun', 'Ethan Fang (a)'] },
  { name: 'Steve Lyons', golfers: ['Matt McCarty', 'Jacob Bridgeman', 'Sungjae Im', 'Min Woo Lee', 'Cameron Smith', 'Matt Fitzpatrick'] },
  { name: 'Brent Minta', golfers: ['Ludvig Åberg', 'Bryson DeChambeau', 'Corey Conners', 'Russell Henley', 'Nicolai Højgaard', 'Ethan Fang (a)'] },
  { name: 'Dylan Nasiatka', golfers: ['Tommy Fleetwood', 'Justin Rose', 'Cameron Young', 'Jake Knapp', 'Maverick McNealy', 'Brandon Holtz (a)'] },
  { name: 'Ryan Owens', golfers: ['Bryson DeChambeau', 'Akshay Bhatia', 'Sepp Straka', 'Gary Woodland', 'Marco Penge', 'Aaron Rai'] },
  { name: 'Tim Reen', golfers: ['Scottie Scheffler', 'Ludvig Åberg', 'Akshay Bhatia', 'Jacob Bridgeman', 'Brian Harman', 'Bubba Watson'] },
  { name: 'John Shoemaker', golfers: ['Scottie Scheffler', 'Corey Conners', 'Sepp Straka', 'Matt McCarty', 'Harry Hall', 'Maverick McNealy'] },
  { name: 'Carli Todd', golfers: ['Jon Rahm', 'Xander Schauffele', 'Tyrrell Hatton', 'Maverick McNealy', 'Min Woo Lee', 'Ethan Fang (a)'] },
  { name: 'James Weilbrenner', golfers: ['Scottie Scheffler', 'Ludvig Åberg', 'Patrick Reed', 'Matt Fitzpatrick', 'Jackson Herrington (a)', 'Ethan Fang (a)'] },
  { name: 'Jarrett Wolfe', golfers: ['Scottie Scheffler', 'Ludvig Åberg', 'Corey Conners', 'Brooks Koepka', 'Andrew Novak', 'Mason Howell (a)'] },
  { name: 'Will Rhymes', golfers: ['Ludvig Åberg', 'Robert MacIntyre', 'Matt Fitzpatrick', 'Adam Scott', 'Maverick McNealy', 'Max Greyserman'] },
  { name: 'Tyler Duncan', golfers: ['Scottie Scheffler', 'Matt Fitzpatrick', 'Si Woo Kim', 'Min Woo Lee', 'Sam Stevens', 'Nick Taylor'] },
]

function formatTeamTotal(total: number | null): string {
  if (total === null) return '--'
  if (total === 0) return 'E'
  return total > 0 ? `+${total}` : `${total}`
}

function computeTeamScore(
  team: PoolTeam,
  golferMap: Map<string, GolferResult>,
): Omit<TeamScore, 'rank'> {
  // Resolve each pick against the ESPN leaderboard
  const picks = team.golfers.map((csvName, idx) => ({
    idx,
    displayName: csvName.replace(/\s*\(a\)/gi, '').trim(),
    result: golferMap.get(normalizeKey(csvName)),
  }))

  // Sort picks by score ascending to find best 5; nulls go last
  const byScore = [...picks].sort((a, b) => {
    const sa = a.result?.score ?? 999
    const sb = b.result?.score ?? 999
    return sa - sb
  })

  // The best-5 are the first 5 after sorting by score
  const best5Indices = new Set(byScore.slice(0, 5).map(p => p.idx))

  // Build display golfers in original pick order
  const golfers: PoolGolferScore[] = picks.map(p => ({
    name: p.displayName,
    score: p.result?.score ?? null,
    scoreDisplay: p.result?.scoreDisplay ?? '--',
    thru: p.result?.thru ?? '--',
    status: p.result?.status ?? 'pending',
    counting: best5Indices.has(p.idx),
  }))

  // Team total = sum of scores for counting golfers that have an actual score
  const countingGolfers = golfers.filter(g => g.counting)
  const scoringCount = countingGolfers.filter(g => g.score !== null).length
  const teamTotal = scoringCount > 0
    ? countingGolfers.reduce((sum, g) => sum + (g.score ?? 0), 0)
    : null

  return {
    participantName: team.name,
    teamTotal,
    teamTotalDisplay: formatTeamTotal(teamTotal),
    scoringCount,
    golfers,
  }
}

export function computeAllTeamScores(leaderboard: GolferResult[]): TeamScore[] {
  const golferMap = buildGolferMap(leaderboard)
  const unsorted = POOL_TEAMS.map(team => computeTeamScore(team, golferMap))

  // Sort: team total ascending, scoring count descending (more scores = more complete), alphabetical
  unsorted.sort((a, b) => {
    if (a.teamTotal === null && b.teamTotal === null) return a.participantName.localeCompare(b.participantName)
    if (a.teamTotal === null) return 1
    if (b.teamTotal === null) return -1
    if (a.teamTotal !== b.teamTotal) return a.teamTotal - b.teamTotal
    if (b.scoringCount !== a.scoringCount) return b.scoringCount - a.scoringCount
    return a.participantName.localeCompare(b.participantName)
  })

  // Assign ranks with ties
  const standings: TeamScore[] = []
  let rank = 1
  for (let i = 0; i < unsorted.length; ) {
    const total = unsorted[i].teamTotal
    let j = i
    while (j < unsorted.length && unsorted[j].teamTotal === total) j++
    const tieCount = j - i
    for (let k = i; k < j; k++) {
      standings.push({ ...unsorted[k], rank })
    }
    rank += tieCount
    i = j
  }

  return standings
}

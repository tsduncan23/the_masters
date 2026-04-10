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
  { name: 'Matt Smith', golfers: ['Adam Scott', 'Max Greyserman', 'Xander Schauffele', 'Justin Rose', 'Sam Burns', 'Daniel Berger'] },
  { name: 'Don Alexander', golfers: ['Ludvig Åberg', 'Cameron Young', 'Akshay Bhatia', 'Jason Day', 'Harris English', 'Haotong Li'] },
  { name: 'Tom Kunis', golfers: ['Tommy Fleetwood', 'Ludvig Åberg', 'Hideki Matsuyama', 'Jacob Bridgeman', 'J.J. Spaun', 'Fred Couples'] },
  { name: 'Austin Chubb', golfers: ['Xander Schauffele', 'Corey Conners', 'Jason Day', 'Sungjae Im', 'Harris English', 'Keegan Bradley'] },
  { name: 'Ian Walsh', golfers: ['Jake Knapp', 'Robert MacIntyre', 'Matt Fitzpatrick', 'Chris Gotterup', 'Bubba Watson', 'Kurt Kitayama'] },
  { name: 'Sean Coyne', golfers: ['Scottie Scheffler', 'Justin Rose', 'Jake Knapp', 'Russell Henley', 'Brian Harman', 'Nick Taylor'] },
  { name: 'Alan Matthews', golfers: ['Scottie Scheffler', 'Cameron Young', 'Adam Scott', 'Max Greyserman', 'Patrick Reed', 'Haotong Li'] },
  { name: 'Billy Gasparino', golfers: ['Jon Rahm', 'Brooks Koepka', 'Corey Conners', 'Sergio Garcia', 'Keegan Bradley', 'Brian Harman'] },
  { name: 'Durin O\'Linger', golfers: ['Xander Schauffele', 'Matt Fitzpatrick', 'Cameron Young', 'Min Woo Lee', 'Jacob Bridgeman', 'Ethan Fang (a)'] },
  { name: 'Brian Compton', golfers: ['Sepp Straka', 'Min Woo Lee', 'Russell Henley', 'Nicolai Højgaard', 'Rasmus Højgaard', 'Rory McIlroy'] },
  { name: 'Lee Tackett', golfers: ['Xander Schauffele', 'Cameron Young', 'Si Woo Kim', 'Rasmus Neergaard-Petersen', 'Ryan Gerard', 'Maverick McNealy'] },
  { name: 'Tyler DeJong', golfers: ['Bryson DeChambeau', 'Justin Rose', 'Ludvig Åberg', 'Keegan Bradley', 'Nicolai Højgaard', 'Vijay Singh'] },
  { name: 'Danny Dorn', golfers: ['Hideki Matsuyama', 'Bryson DeChambeau', 'Robert MacIntyre', 'Min Woo Lee', 'Michael Brennan', 'Maverick McNealy'] },
]

function formatTeamTotal(total: number | null): string {
  if (total === null) return '--'
  if (total === 0) return 'E'
  return total > 0 ? `+${total}` : `${total}`
}

function computeTeamScore(
  team: PoolTeam,
  golferMap: Map<string, GolferResult>,
  worstActiveScore: number | null,
): Omit<TeamScore, 'rank'> {
  // Resolve each pick against the ESPN leaderboard
  const picks = team.golfers.map((csvName, idx) => {
    const result = golferMap.get(normalizeKey(csvName))
    // Weekend penalty: cut players count as the worst active score instead of their own
    const penaltyScore =
      result?.status === 'cut' && worstActiveScore !== null ? worstActiveScore : null
    const effectiveScore = penaltyScore ?? result?.score ?? null
    return {
      idx,
      displayName: csvName.replace(/\s*\(a\)/gi, '').trim(),
      result,
      penaltyScore,
      effectiveScore,
    }
  })

  // Sort picks by effective score ascending to find best 5; nulls go last
  const byScore = [...picks].sort((a, b) => {
    const sa = a.effectiveScore ?? 999
    const sb = b.effectiveScore ?? 999
    return sa - sb
  })

  // The best-5 are the first 5 after sorting by effective score
  const best5Indices = new Set(byScore.slice(0, 5).map(p => p.idx))

  // Build display golfers in original pick order
  const golfers: PoolGolferScore[] = picks.map(p => ({
    name: p.displayName,
    headshot: p.result?.headshot ?? '',
    score: p.result?.score ?? null,
    scoreDisplay: p.result?.scoreDisplay ?? '--',
    thru: p.result?.thru ?? '--',
    status: p.result?.status ?? 'pending',
    counting: best5Indices.has(p.idx),
    penaltyScore: best5Indices.has(p.idx) ? p.penaltyScore : null,
  }))

  // Team total = sum of effective scores for counting golfers that have a score
  const countingPicks = picks.filter(p => best5Indices.has(p.idx))
  const scoringCount = countingPicks.filter(p => p.effectiveScore !== null).length
  const teamTotal = scoringCount > 0
    ? countingPicks.reduce((sum, p) => sum + (p.effectiveScore ?? 0), 0)
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

  // Weekend penalty: once the cut is made, cut players count as the worst active score
  const cutMade = leaderboard.some(g => g.status === 'cut')
  const worstActiveScore = cutMade
    ? Math.max(
        ...leaderboard
          .filter(g => g.status === 'active' && g.score !== null)
          .map(g => g.score as number)
      )
    : null

  const unsorted = POOL_TEAMS.map(team => computeTeamScore(team, golferMap, worstActiveScore))

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

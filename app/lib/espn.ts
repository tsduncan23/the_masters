import type { GolferResult, GolferStatus } from './types'

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard'

// ESPN response types (loose – we only read what we need)
interface EspnStatistic {
  name: string
  displayValue: string
}

interface EspnCompetitor {
  id: string
  order?: number
  score?: { displayValue?: string }
  athlete?: { displayName?: string; shortName?: string }
  status?: {
    displayValue?: string
    type?: { name?: string; state?: string; completed?: boolean }
  }
  linescores?: Array<{ displayValue?: string }>
  statistics?: EspnStatistic[]
}

interface EspnResponse {
  events?: Array<{
    name?: string
    competitions?: Array<{
      competitors?: EspnCompetitor[]
    }>
  }>
}

function parseScore(s: string | undefined): number | null {
  if (!s || s === '-' || s === '--' || s === '') return null
  if (s === 'E') return 0
  if (/^(CUT|WD|MDF|DQ)$/i.test(s)) return null
  const n = parseInt(s, 10)
  return isNaN(n) ? null : n
}

function formatScoreDisplay(score: number | null, status: GolferStatus): string {
  if (status === 'cut') return 'CUT'
  if (status === 'wd') return 'WD'
  if (score === null) return '--'
  if (score === 0) return 'E'
  return score > 0 ? `+${score}` : `${score}`
}

function getStat(stats: EspnStatistic[] | undefined, name: string): string | undefined {
  return stats?.find(s => s.name === name)?.displayValue
}

function getStatus(c: EspnCompetitor): GolferStatus {
  const dv = c.status?.displayValue?.toUpperCase() ?? ''
  if (dv === 'CUT' || dv === 'MDF') return 'cut'
  if (dv === 'WD' || dv === 'DQ') return 'wd'
  const state = c.status?.type?.state
  if (state === 'in' || state === 'pre') return 'active'
  if (c.status?.type?.completed) return 'active'
  return 'pending'
}

function buildPositionMap(competitors: EspnCompetitor[]): Map<string, string> {
  const posMap = new Map<string, string>()

  // Split active vs eliminated
  const active = competitors.filter(c => {
    const dv = c.status?.displayValue?.toUpperCase() ?? ''
    return dv !== 'CUT' && dv !== 'WD' && dv !== 'MDF' && dv !== 'DQ'
  })
  const eliminated = competitors.filter(c => {
    const dv = c.status?.displayValue?.toUpperCase() ?? ''
    return dv === 'CUT' || dv === 'WD' || dv === 'MDF' || dv === 'DQ'
  })

  let pos = 1
  let i = 0
  while (i < active.length) {
    const scoreVal = active[i].score?.displayValue ?? getStat(active[i].statistics, 'toPar') ?? ''
    let j = i
    while (j < active.length) {
      const sv = active[j].score?.displayValue ?? getStat(active[j].statistics, 'toPar') ?? ''
      if (sv !== scoreVal) break
      j++
    }
    const count = j - i
    const display = count > 1 ? `T${pos}` : `${pos}`
    for (let k = i; k < j; k++) {
      posMap.set(active[k].id, display)
    }
    pos += count
    i = j
  }

  for (const c of eliminated) {
    const dv = c.status?.displayValue?.toUpperCase() ?? ''
    posMap.set(c.id, dv === 'WD' || dv === 'DQ' ? 'WD' : 'CUT')
  }

  return posMap
}

export interface ESPNResult {
  tournamentName: string
  golfers: GolferResult[]
}

export async function fetchESPNLeaderboard(): Promise<ESPNResult> {
  const res = await fetch(ESPN_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error(`ESPN API returned ${res.status}`)

  const data: EspnResponse = await res.json()
  const event = data.events?.[0]
  const tournamentName = event?.name ?? 'Masters Tournament'
  const competitors = event?.competitions?.[0]?.competitors ?? []

  const posMap = buildPositionMap(competitors)

  const golfers: GolferResult[] = competitors.map(c => {
    const status = getStatus(c)
    const rawScore = c.score?.displayValue ?? getStat(c.statistics, 'toPar')
    const score = parseScore(rawScore)

    const thruRaw = c.status?.displayValue ?? getStat(c.statistics, 'thru') ?? '--'
    let thru: string
    const thruUpper = thruRaw.toUpperCase()
    if (thruUpper === 'CUT' || thruUpper === 'MDF') thru = 'CUT'
    else if (thruUpper === 'WD' || thruUpper === 'DQ') thru = 'WD'
    else thru = thruRaw

    const rounds: string[] = [1, 2, 3, 4].map(i => {
      const linescore = c.linescores?.[i - 1]?.displayValue
      const statScore = getStat(c.statistics, `R${i}`)
      const val = linescore ?? statScore
      return val && val !== '0' && val !== '-' ? val : '--'
    })

    return {
      id: c.id,
      name: c.athlete?.displayName ?? 'Unknown',
      score,
      scoreDisplay: formatScoreDisplay(score, status),
      position: posMap.get(c.id) ?? '--',
      thru,
      rounds,
      status,
    }
  })

  return { tournamentName, golfers }
}

/** Build a lookup map from normalizedKey → GolferResult */
export function buildGolferMap(golfers: GolferResult[]): Map<string, GolferResult> {
  const map = new Map<string, GolferResult>()
  for (const g of golfers) {
    map.set(normalizeKey(g.name), g)
  }
  return map
}

export function normalizeKey(name: string): string {
  return name
    .replace(/\s*\(a\)\s*/gi, '')        // strip amateur tag
    .normalize('NFD')                      // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')       // strip combining diacritics (é→e, Å→A)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .slice(1)                              // drop first name, keep last name(s)
    .join(' ')
}

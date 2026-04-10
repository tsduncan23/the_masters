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
  athlete?: { displayName?: string; shortName?: string; headshot?: { href?: string } }
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

function holesRemaining(thru: string): number {
  if (thru === 'F' || thru === 'CUT' || thru === 'WD') return 0
  if (thru === '--') return 18
  const n = parseInt(thru, 10)
  return isNaN(n) ? 0 : 18 - n
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

  // Build golfers without position first (assigned after sorting)
  const golfers: GolferResult[] = competitors.map(c => {
    const status = getStatus(c)
    // scoreToPar is the tournament total to-par; score.displayValue is the current-round score
    const rawScore = getStat(c.statistics, 'scoreToPar') ?? c.score?.displayValue
    const score = parseScore(rawScore)

    // status.displayValue is "Thru 7", "F", "CUT", "WD", etc.
    const statusDv = c.status?.displayValue ?? ''
    const statusUpper = statusDv.toUpperCase()
    let thru: string
    if (statusUpper === 'CUT' || statusUpper === 'MDF') thru = 'CUT'
    else if (statusUpper === 'WD' || statusUpper === 'DQ') thru = 'WD'
    else if (statusUpper === 'F') thru = 'F'
    else {
      const m = statusDv.match(/^Thru\s+(\d+)$/i)
      thru = m ? m[1] : '--'
    }

    const rounds: string[] = [1, 2, 3, 4].map(i => {
      const linescore = c.linescores?.[i - 1]?.displayValue
      const statScore = getStat(c.statistics, `R${i}`)
      const val = linescore ?? statScore
      return val && val !== '0' && val !== '-' ? val : '--'
    })

    return {
      id: c.id,
      name: c.athlete?.displayName ?? 'Unknown',
      headshot: c.athlete?.headshot?.href ?? '',
      score,
      scoreDisplay: formatScoreDisplay(score, status),
      position: '--',  // assigned below after sorting
      thru,
      rounds,
      status,
    }
  })

  // Sort: lowest score first; tiebreak by holes remaining desc; eliminated last
  golfers.sort((a, b) => {
    const aElim = a.status === 'cut' || a.status === 'wd'
    const bElim = b.status === 'cut' || b.status === 'wd'
    if (aElim !== bElim) return aElim ? 1 : -1
    const sa = a.score ?? 999
    const sb = b.score ?? 999
    if (sa !== sb) return sa - sb
    return holesRemaining(b.thru) - holesRemaining(a.thru)
  })

  // Assign positions from the sorted order (ties share the same rank)
  let pos = 1
  let i = 0
  while (i < golfers.length) {
    const g = golfers[i]
    if (g.status === 'cut' || g.status === 'wd') {
      g.position = g.status === 'wd' ? 'WD' : 'CUT'
      i++
      continue
    }
    if (g.score === null) {
      g.position = '--'
      i++
      continue
    }
    // Find the end of this tie group (same score, same holes remaining)
    let j = i + 1
    while (
      j < golfers.length &&
      golfers[j].status !== 'cut' &&
      golfers[j].status !== 'wd' &&
      golfers[j].score === g.score &&
      holesRemaining(golfers[j].thru) === holesRemaining(g.thru)
    ) {
      j++
    }
    const count = j - i
    const label = count > 1 ? `T${pos}` : `${pos}`
    for (let k = i; k < j; k++) golfers[k].position = label
    pos += count
    i = j
  }

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
}

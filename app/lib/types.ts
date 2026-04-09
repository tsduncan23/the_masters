export type GolferStatus = 'active' | 'cut' | 'wd' | 'pending'

export interface GolferResult {
  id: string
  name: string
  score: number | null        // to-par total, null if not started or WD
  scoreDisplay: string        // "-10", "E", "+2", "CUT", "WD", "--"
  position: string            // "1", "T2", "CUT", "WD", "--"
  thru: string                // "F", "14", "--", "CUT", "WD"
  rounds: string[]            // ["66", "67", "--", "--"] R1–R4
  status: GolferStatus
}

export interface PoolGolferScore {
  name: string                // display name (without "(a)")
  score: number | null
  scoreDisplay: string
  thru: string
  status: GolferStatus
  counting: boolean           // true if this is one of the best 5
}

export interface TeamScore {
  rank: number
  participantName: string
  teamTotal: number | null    // null if no scores yet
  teamTotalDisplay: string    // "-10", "E", "+2", "--"
  scoringCount: number        // 0–5 golfers with actual scores in best-5
  golfers: PoolGolferScore[]
}

export interface ApiResponse {
  tournamentName: string
  leaderboard: GolferResult[]
  poolStandings: TeamScore[]
  lastUpdated: string         // ISO timestamp
  error?: string
}

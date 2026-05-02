# The Masters Pool

## Project Overview
A password-protected, live Masters golf pool web app. Participants pick 6 golfers; best 5 scores count toward their team total. Live scoring is pulled from ESPN every 15 seconds. Built for the 2026 Masters — update picks and year branding each April before the tournament.

## Repo & Stack
- GitHub: https://github.com/tsduncan23/the_masters (private)
- Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- **The Next.js app lives in `app/` — not the repo root**
- Deployed on Vercel; root directory must be set to `app/`

---

## Key Files

| File | Purpose |
|------|---------|
| `app/lib/pool.ts` | Hardcoded pool picks (`POOL_TEAMS` array) and all scoring logic |
| `app/lib/espn.ts` | ESPN API integration — fetches leaderboard, normalizes names, assigns positions |
| `app/lib/types.ts` | Shared TypeScript types (`GolferResult`, `PoolGolferScore`, `TeamScore`, etc.) |
| `app/app/page.tsx` | Main UI — leaderboard, pool standings, entry detail card, refresh logic |
| `app/app/api/leaderboard/route.ts` | Server-side endpoint that fetches ESPN data and computes team scores |
| `app/app/api/auth/login/route.ts` | Password auth — checks against `POOL_PASSWORD` env var, sets cookie |
| `app/app/api/auth/logout/route.ts` | Clears the auth cookie |
| `app/app/login/page.tsx` | Login page |
| `app/components/TournamentLeaderboard.tsx` | Tournament leaderboard table with cut line indicator |
| `app/components/PoolStandings.tsx` | Pool standings table with cut status color coding |
| `app/components/ScoreBadge.tsx` | Score display badge (red for under par, green for over par) |
| `app/components/RefreshBar.tsx` | Countdown + manual refresh UI |
| `masters_pool_selections.csv` | Original picks spreadsheet (source of truth for `POOL_TEAMS`) |

---

## Environment Variables
- `POOL_PASSWORD` — shared password all pool participants use to log in
  - To pause the site: remove or change this on Vercel and redeploy

---

## Deployment
- Platform: Vercel
- Vercel project root directory: `app/`
- Live URL: https://app-three-alpha-92.vercel.app
- Deploy command: `vercel --prod` from `app/` directory
- The Vercel plugin is installed — restart Claude Code to load it

---

## ESPN API Integration

### Endpoint
```
https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard
```

### Key field mappings (non-obvious — do not guess)
- **Tournament total to-par**: `statistics` array, `name === 'scoreToPar'` → `displayValue`
- **Current round score**: `score.displayValue` — always `"E"` for active players mid-round; do not use for team scoring
- **Thru / status**: `status.displayValue` — format is `"Thru 7"`, `"F"`, `"CUT"`, `"WD"`, or a date string like `"April 10, 2026"` for players awaiting their tee time
  - Only extract hole number when string matches `/^Thru\s+(\d+)$/i` — a plain `/\d+/` regex will match the year from date strings
- **Headshot**: `competitor.athlete.headshot.href` — ESPN CDN URL (e.g. `https://a.espncdn.com/i/headshots/golf/players/full/10046.png`)
- **Round scores**: `competitor.linescores[0..3].displayValue` (R1–R4)

### Name normalization
Full-name keys are used to avoid sibling collisions (e.g. Nicolai vs. Rasmus Højgaard). `normalizeKey()` in `espn.ts`:
- Strips `(a)` amateur tag
- NFD-decomposes and strips combining diacritics (é→e, Å→A)
- Lowercases and trims
- **Does not drop the first name** — last-name-only caused Højgaard brothers to collide

### Position assignment
Positions are assigned **after** sorting, not from the raw ESPN order. Sort order:
1. Score ascending (lowest/best first)
2. Tiebreak: holes remaining descending (more holes left = ranked higher, still playing)
3. Eliminated (cut/WD) last

---

## Pool Scoring Rules

### Best-5-of-6
Each team picks 6 golfers. The 5 with the best (lowest) effective scores count. The 6th is dropped (shown struck-through in the UI).

### Weekend cut penalty (R3/R4 only)
Once the cut is made (any player has `status === 'cut'`), cut players on a team are assigned a **penalty score** equal to the worst score among players still active in the tournament. This penalty score:
- Replaces the cut player's actual score for best-5 selection and team total calculation
- Is shown in the UI as `"CUT → +X"` in orange so it's clear what they're counting as
- Is stored in `PoolGolferScore.penaltyScore` (separate from `score`, which always shows the actual round score)

### Cut line projection (R1/R2 only)
- `getProjectedCutScore()` in `page.tsx` returns the score at position 50 among active players
- Returns `null` once the real cut is made
- Used to color-code golfer cells: green = safe, yellow = within 2 strokes of cut, red = outside cut

### Tie-breaking for team rank
Teams with equal totals share the same rank. Secondary sort: more scoring golfers (higher `scoringCount`) ranks first.

---

## UI Layout
- **Header**: Masters green (`#006747`), shows tournament name + refresh countdown
- **Entry picker**: Dropdown to select a participant → shows expanded card with all 6 picks and cut status
- **Main grid**: Two columns on xl screens — leaderboard left (420px fixed), pool standings right
- **Color scheme**: Masters green `#006747`, gold `#CBA052`, background `#F0F7F4`
- **Headshots**: Circular, from ESPN CDN. Allowed in `next.config.ts` via `remotePatterns`
- **Auto-refresh**: Every 15 seconds (`REFRESH_INTERVAL = 15` in `page.tsx`)

---

## Annual Update Checklist (each April)
1. **Update picks**: Replace `POOL_TEAMS` array in `app/lib/pool.ts` with new selections from the CSV
2. **Update year**: Change `"The Masters 2026"` in `app/app/page.tsx` header and `app/app/login/page.tsx` title
3. **Set `POOL_PASSWORD`** on Vercel for the new year's group
4. **Verify ESPN field names** still match — ESPN occasionally changes their API response shape
5. **Check name matching**: Run a quick comparison of pool names against ESPN names to catch any mismatches or new player name formats

---

## Known Quirks & Past Bugs

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Scores showing `"E"` for all mid-round players | `score.displayValue` is current-round score, not tournament total | Use `scoreToPar` stat instead |
| `"Thru"` column showing `"2026"` for pre-round players | `status.displayValue` is a date string for waiting players; `/\d+/` matched the year | Only parse when string matches `^Thru \d+` |
| Nicolai Højgaard showing Rasmus's score | Last-name-only key normalized both brothers to `"højgaard"` | Switched to full-name normalization |
| Tables too wide / overflowing | Grid children needed `min-w-0` to allow shrinking | Added `min-w-0` to both section wrappers |
| Position numbers wrong (worst score at top) | `buildPositionMap` ran on unsorted ESPN data | Removed it; assign positions after sorting |

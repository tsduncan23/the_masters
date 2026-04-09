# The Masters Pool 2026

## Project Overview
A password-protected, live Masters golf pool app. Participants pick 6 golfers; best 5 scores count. Live scoring pulled from ESPN every 60 seconds.

## Repo
- GitHub: https://github.com/tsduncan23/the_masters (private)
- Stack: Next.js (App Router), TypeScript, Tailwind
- The Next.js app lives in `app/` — not the repo root

## Key Files
- `app/lib/pool.ts` — hardcoded pool picks (POOL_TEAMS array), scoring logic
- `app/lib/espn.ts` — ESPN API integration
- `app/app/api/leaderboard/route.ts` — server-side data fetch endpoint
- `app/app/api/auth/login/route.ts` — password auth (uses POOL_PASSWORD env var)
- `masters_pool_slections.csv` — original picks spreadsheet

## Environment Variables
- `POOL_PASSWORD` — the shared password all pool participants use to log in

## Deployment Status
- Vercel plugin installed (`vercel/vercel-plugin`) — restart Claude Code to load it
- Not yet deployed — next step is to deploy via the Vercel plugin
- When deploying: set root directory to `app/`, add `POOL_PASSWORD` env var

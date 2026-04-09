# The Masters Pool 2026

Live leaderboard and pool standings for a private Masters golf pool. Built with Next.js, pulls live scoring data from ESPN.

## Features

- Live tournament leaderboard updated every 60 seconds from ESPN
- Pool standings — each participant picks 6 golfers, best 5 scores count
- Password-protected access (share one password with your group)
- Mobile-friendly layout

## Environment Variables

Create a `.env.local` file in the `app/` directory:

```
POOL_PASSWORD=your_password_here
```

This is the password all participants use to log in.

## Local Development

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

This app is designed to deploy on [Vercel](https://vercel.com). See the deployment walkthrough below.

Set the `POOL_PASSWORD` environment variable in your Vercel project settings before deploying.

## Pool Picks

Participant picks are stored in `masters_pool_slections.csv` and hardcoded in `app/lib/pool.ts`. To update picks, edit the `POOL_TEAMS` array in that file.

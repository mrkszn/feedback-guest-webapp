# feedback-guest-webapp

Guest feedback web app — **"your evening as a feed."** A short, tactile story of
a guest's evening: they swipe through the beats (arrival → order → wait → food →
service → leaving), spin a mood slider and pick a few tags on each (≤ 60s). Only
then does a focused AI dig kick in — and only on the low-scored beats. It ends
with a "here's your evening" mood curve.

Not a chat: the guest **moves and taps**; they only type or speak if they choose to.

## Stack

Vite · React · TypeScript · Tailwind · framer-motion · PWA. Mobile-first, no SSR.

## Develop

```bash
cp .env.example .env        # set VITE_API_BASE_URL
npm install
npm run dev
```

Scripts: `build`, `preview`, `lint`, `typecheck`, `check:i18n`.

## Flow & routes

| Route      | Screen | Notes |
|------------|--------|-------|
| `/?t=…`    | Entry  | One-time token → auth → straight to the feed |
| `/`        | Entry  | "How did you reach us?" — anonymous start or paste a link |
| `/welcome` | Welcome | Hero + animated beat preview |
| `/feed`    | Feed   | Horizontal snap pager, mood slider + tags per beat |
| `/recap`   | Recap  | Mood curve; weak beats pulse |
| `/dig`     | Dig    | AI "guess-cards" for weak beats; tap / type / voice |
| `/final`   | Final  | Thank-you, pinned curve, share, finalize |

## API contract

The app targets the backend's public `presentations/http_guest_api` (the
`/guest/*` prefix). All endpoints, request/response shapes live in
`src/api/types.ts` and `src/api/guest.ts`. Content strings arrive pre-localized
(`*_uk` / `*_en`); the frontend only translates UI chrome (`src/i18n`).

## i18n discipline

UI chrome lives in `src/i18n/dicts`. Content (beat labels, tags, AI guesses)
comes from the API already localized — never translated client-side. CI guard:
`npm run check:i18n` fails on hardcoded Cyrillic outside the dictionaries.

## Resilience

- Lazy routes auto-reload once after a deploy (stale chunk) via a sessionStorage
  flag — see `src/lib/lazyWithRetry.ts`.
- App-wide `ErrorBoundary` with a friendly, localized fallback.
- Full feed state restores from `GET /guest/sessions/{id}` on re-entry.
- Network never blocks the UI: optimistic autosave, toast + backoff retries.

## Deploy (Vercel)

Root = repo, build `npm run build`, output `dist`. SPA rewrites in `vercel.json`.
Set `VITE_API_BASE_URL` in the Vercel project env.

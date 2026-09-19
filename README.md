# Elijah Nang Tribute

A memorial / archive website project for Elijah Nang, built for deployment with **GitHub + Railway** and implemented with **Next.js + TypeScript + Tailwind CSS**.

## Project Goal
Create a respectful, well-designed one-page site for **nangsoul.com** that serves as:
- a memorial tribute
- a concise artist bio
- a curated link hub to Elijah Nang's public work
- a clean archive entry point for YouTube, Spotify, SoundCloud, and social platforms

## Suggested Stack
- Next.js
- TypeScript
- Tailwind CSS
- GitHub
- Railway

## Recommended Positioning
This site should be framed as an **unofficial memorial archive** unless you have direct permission from family, collaborators, or the estate to present it otherwise.

## Included Docs
- `PROJECT_BRIEF.md`
- `CLAUDE_CODE_PROMPT.md`
- `SITE_COPY.md`
- `CONTENT_DATA_EXAMPLE.md`
- `DEPLOYMENT_CHECKLIST.md`
- `LEGAL_AND_EDITORIAL_NOTES.md`

## Suggested Repo Name
You said the repository is named:

**Elijah Nang Tribute**

A code-friendly folder or slug variation could be:

`elijah-nang-tribute`

## Suggested Site Sections
1. Hero
2. About
3. Featured Works
4. Listen / Watch
5. Legacy
6. Footer / disclaimer

## Primary Links
- YouTube: https://www.youtube.com/@elijahnang90
- Spotify: https://open.spotify.com/artist/0yIO6HI875mLzamqmjjFFU
- SoundCloud: https://soundcloud.com/elijahnang
- Instagram: https://www.instagram.com/elijahnang/
- Twitch: https://www.twitch.tv/nangsoul
- Facebook: https://www.facebook.com/elijahnang91

## Memorial messages setup

The public message board uses PostgreSQL through server-only Route Handlers. Add a PostgreSQL service and the application service to the same Railway environment, then reference the database service's private `DATABASE_URL` variable from the application. Keep the database off a public TCP proxy. The service's `.railway/railway.ts` configuration runs `npm run db:migrate` before deployment. The runner takes a PostgreSQL advisory lock, records each applied SQL file in `schema_migrations`, and is safe to rerun. Do not expose `DATABASE_URL`, `TURNSTILE_SECRET_KEY`, `MEMORIAL_ADMIN_PASSWORD`, `MEMORIAL_ADMIN_SESSION_SECRET`, or `MEMORIAL_RATE_LIMIT_SALT` in browser variables.

Create a Cloudflare Turnstile widget for the Railway hostname (and any approved custom domain) and use its site key as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and its secret as `TURNSTILE_SECRET_KEY`. Submissions are server-validated and rate-limited atomically in PostgreSQL to three per hour per salted client fingerprint; `MEMORIAL_RATE_LIMIT_SALT` is required. In production the application accepts only Railway's `X-Real-IP` client-IP header and rejects a submission if it is unavailable. Submissions are always stored as `pending`.

Set `MEMORIAL_PUBLIC_ORIGIN` to the exact public `https://` origin visitors use (for example, `https://nangsoul-web-staging.up.railway.app`). It is required in production: public submissions, admin sign-in, and moderation fail closed if it is missing or invalid. This protects same-origin and CSRF checks without trusting client-controlled forwarded-host headers.

Open `/admin/memorial` to sign in with `MEMORIAL_ADMIN_PASSWORD`. The page uses a signed, HttpOnly, Secure-in-production, SameSite-Strict session cookie. Approving or rejecting a message is authenticated server-side and additionally checks same-origin and a session-bound CSRF token. Only `approved` messages are returned by the public endpoint.

Use `GET /api/health` as the Railway healthcheck path. It returns `200` only when the application can query PostgreSQL; it never returns database credentials or message data.

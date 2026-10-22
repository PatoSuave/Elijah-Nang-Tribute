# Elijah Nang Tribute

A memorial / archive website for Elijah Nang, implemented with **Next.js-compatible App Router source, TypeScript and Tailwind CSS**, built with **vinext** for **Cloudflare Workers + D1**. GitHub remains the source repository.

## Project Goal
Create a respectful, well-designed one-page site for **nangsoul.com** that serves as:
- a memorial tribute
- a concise artist bio
- a curated link hub to Elijah Nang's public work
- a clean archive entry point for YouTube, Spotify, SoundCloud, and social platforms

## Suggested Stack
- Next.js App Router source + vinext
- TypeScript
- Tailwind CSS
- GitHub
- Cloudflare Workers, D1 and Turnstile

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

The public board uses the server-only `MEMORIAL_DB` D1 binding. `wrangler.jsonc` has separate local, staging and production databases. Apply `migrations/d1/` explicitly to the intended database. Worker secrets are `TURNSTILE_SECRET_KEY`, `MEMORIAL_ADMIN_PASSWORD`, `MEMORIAL_ADMIN_SESSION_SECRET` and `MEMORIAL_RATE_LIMIT_SALT`. Never put them in source, browser variables or build arguments.

Turnstile's public site key is read from Worker vars at request time and passed alone to the browser. Submissions are server-validated and limited to three per UTC hour per salted client fingerprint. A D1 batch transaction serializes duplicate detection, insertion and quota charging; failed writes roll back together. Identical submissions within ten minutes are rejected without using quota. New messages are always `pending`. Production trusts only Cloudflare's edge-controlled `CF-Connecting-IP`, never `X-Real-IP` or `X-Forwarded-For`.

Set `MEMORIAL_PUBLIC_ORIGIN` to the exact public HTTPS origin visitors use. It is required in staging/production: submissions, admin sign-in and moderation fail closed if it is missing or invalid. Missing secrets and missing/malformed trusted IPs also fail closed. Only `MEMORIAL_ENVIRONMENT=local` enables loopback development behavior.

Open `/admin/memorial` to sign in with `MEMORIAL_ADMIN_PASSWORD`. The page uses a signed, HttpOnly, Secure-in-production, SameSite-Strict session cookie. Approving or rejecting a message is authenticated server-side and additionally checks same-origin and a session-bound CSRF token. Only `approved` messages are returned by the public endpoint.

`GET /api/health` returns `200` only when both D1 tables are queryable, otherwise `503`. It never returns credentials or message data.

## Local development and checks

Use Node 22 or newer (validated with Node 24). Run `npm ci`, copy `.dev.vars.example` to ignored `.dev.vars` for local secrets, then `npm run db:migrate` and `npm run dev`. Local migrations never target the remote databases.

```text
npm test
npm run test:memorial:integration
npm run typecheck
npm run lint
npm run build
npm run test:worker
```

The integration suite runs real workerd/D1 in memory. The HTTP suite executes the built Worker with synthetic credentials and a mocked external Turnstile service, including login/CSRF/moderation. It cannot reach production data. Build before running it after source changes.

## Deployment and migration

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) and [docs/CLOUDFLARE_MIGRATION.md](docs/CLOUDFLARE_MIGRATION.md). `npm run build:staging` and `npm run build:production` select the corresponding environment. Deployment scripts reject a build from the wrong environment.

The old PostgreSQL migration and Railway IaC are historical rollback references. Keep the old service on commit `e50f2c9` until reconciliation/cutover verification finishes; do not redeploy this Workers source to Railway. There is no PostgreSQL connection in the new runtime.

# Cloudflare deployment checklist

## Preview gate

- Keep Railway and its database available. Disable Railway Git auto-deploy before publishing the migration to its watched branch; the new npm commands target Workers.
- Confirm the personal Cloudflare account and the staging D1 ID in `wrangler.jsonc`.
- Run unit tests, D1 integration tests, typecheck, lint, Workers build and built Worker HTTP checks. Obtain independent verification of the frozen candidate.
- Apply staging D1 migrations with `npx wrangler d1 migrations apply MEMORIAL_DB --env staging --remote`.
- Install fresh staging Worker secrets via stdin or the dashboard. Never pass their values as command arguments or save them in Git.
- Run `npm run build:staging`, then the authorized `npm run deploy:staging`.
- On the staging domain, verify the rendered desktop/mobile site, fonts, images, brightness, petal motion/reduced motion, music links/embeds, real Turnstile, submission, admin sign-in, approve/reject, pagination and health. Use synthetic staging messages only.

## Data and cutover gate

- Follow [CLOUDFLARE_MIGRATION.md](docs/CLOUDFLARE_MIGRATION.md) for private backup, microsecond-preserving export, schema inventory and exact count/hash reconciliation.
- Rehearse import on staging before touching the production DB. Keep rehearsal data out of production.
- Freeze writes on the old service. Confirm zero messages in the preceding ten minutes and zero positive, unexpired UTC-hour quota records; if either check is nonzero, wait for expiry and recheck. No extra hour wait is needed when both are already zero. Obtain a final consistent snapshot.
- Confirm the production target is empty, apply its D1 schema and import the final snapshot. Reconcile every message column, all four statuses and all quota rows exactly before accepting writes.
- Set the correct production public origin and fresh secrets. Build/deploy only the production target. Test read-only data and health before routing traffic.
- Move DNS/domain routing to Cloudflare only after the preview and data gates pass. Confirm the zone is active and the old DNS records are backed up before deploying the production-only custom-domain routes. Review the exact `www.nangsoul.com` / `nangsoul.com` changes. Verify TLS, apex 308 path/query preservation, no redirect loop on `www`, and both Workers probe URLs. Confirm version preview URLs are disabled.
- Complete live browser submission and moderation checks with the user's authorized synthetic content. Confirm approved data and private pending/rejected/archived data remain correct.

## Retirement gate

- Retain the original backup, exact reconciliation report, source/deployment IDs and a rollback path outside tracked source.
- Keep Railway available until Cloudflare's site, message submission, admin workflow and imported messages are verified live.
- Once Cloudflare accepts writes, a rollback to the old database requires a fresh D1 export and data reconciliation; reverting DNS alone would lose new messages.
- Shut down Railway only after all gates pass. Report prepared, deployed, reconciled, domain-switched and retired status separately.

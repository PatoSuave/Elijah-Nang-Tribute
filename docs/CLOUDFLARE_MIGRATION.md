# NangSoul: Workers and D1 migration

## Runtime and environments

Cloudflare currently recommends vinext for existing Next.js applications. This app uses vinext 1.3.0, Vite 8, React 19.3.1 and Next.js 16.3.8 types/source conventions. The compatibility check reported all used imports supported, with image resizing partial; the app already uses `images.unoptimized`. vinext remains beta, so an actual Workers preview and browser verification are required before cutover.

- Personal Cloudflare account: `78070ad5939b22bca9c67c6495f6902a`.
- Local Worker/database: `nangsoul-local`, emulated locally only.
- Staging Worker: `nangsoul-staging`, `https://nangsoul-staging.squikyus.workers.dev`; D1 `nangsoul-memorial-staging` (`7e785e41-c239-48dd-8ba7-a5af39726eb7`).
- Production Worker: `nangsoul`, D1 `nangsoul-memorial-production` (`ff2b2e9f-6326-4bd8-942b-bf0f8ff43da1`). Final public origin is `https://www.nangsoul.com`.

`npm run build:staging` or `npm run build:production` selects the Cloudflare environment. The output is `dist/server/wrangler.json` plus public assets in `dist/client`. `npm run deploy:staging` / `npm run deploy:production` check the built Worker name, environment, account and DB against source configuration before invoking Wrangler. No default/root deployment command is provided. Do not pass `--env` to the already-resolved generated config.

Secrets live in Worker secret bindings. The public Turnstile key is a non-secret runtime variable, so it cannot go stale from a forgotten build variable. Same-origin, trusted-IP and auth checks fail closed on missing configuration. Production accepts Cloudflare's `CF-Connecting-IP` only; do not introduce an untrusted proxy or Worker in front of the service that can rewrite the same-zone client IP. Direct requests to Workers are protected by Cloudflare's header normalization.

## Production domains

Only the production environment declares custom-domain routes for `www.nangsoul.com` and `nangsoul.com`, in zone `2800bc8bbc2a3f00307e5e3cea001bbe`. Both staging and production explicitly keep their normal `workers.dev` URLs enabled for probes and disable version preview URLs with `preview_urls: false`.

The narrow Next/vinext request proxy in `src/proxy.ts` sends apex page, API and public-file requests to `https://www.nangsoul.com` with HTTP 308, preserving the path and query text. It checks the request URL hostname exactly and does not redirect `www` or either Workers hostname. This proxy is necessary because vinext 1.3.0 config redirects drop query strings for absolute destinations. Hashed `/_next/static/*` assets retain the existing direct Assets routing; ordinary site navigation canonicalizes before loading them.

Before deploying these production routes, confirm the Cloudflare zone is active, retain the existing DNS record backup, complete the final data import/reconciliation and obtain independent verification. Binding the custom domains replaces the old hostname routing; review Wrangler's exact two-host change set as part of the authorized cutover. Verify TLS, apex redirects, the canonical site and Workers probe URLs after deployment. A local build or dry run does not establish live DNS or certificate status.

## Consistent source snapshot

Keep an original PostgreSQL backup in a private location outside Git. Record live schema, timezone, row counts and PostgreSQL migration state before extraction. The JSON export must come from a consistent read-only transaction; freeze writes before the final export. Do not serialize timestamps via the pg driver's JavaScript `Date` values, which discard microseconds.

Format each non-null timestamp in PostgreSQL with:

```sql
to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
```

Apply the same expression to `approved_at` and quota `window_start`, retaining nulls. Export all columns, including private moderation notes and hashed fingerprints. The snapshot envelope is:

```text
{
  format: "nangsoul-postgres-snapshot-v1",
  exported_at: "<UTC ISO timestamp>",
  source: { schema: "public" },
  tables: {
    memorial_messages: [...],
    memorial_submission_rate_limits: [...],
    schema_migrations: [...]
  },
  counts: {
    memorial_messages: <integer>,
    memorial_submission_rate_limits: <integer>,
    schema_migrations: <integer>
  }
}
```

The converter requires exactly nine message columns (`id`, `display_name`, `location`, `message`, `status`, `created_at`, `approved_at`, `moderation_notes`, `submission_fingerprint`) and three quota columns (`fingerprint`, `window_start`, `submission_count`). Unexpected/missing columns, invalid data, duplicate IDs or count drift stop conversion. `schema_migrations` is backup evidence only; it must not mark the new D1 migration as applied.

## Conversion, import and reconciliation

```text
node scripts/convert-memorial-snapshot.mjs PRIVATE_SOURCE.json PRIVATE_IMPORT.sql
```

This produces a new SQL file and a `.manifest.json` with counts, status counts and SHA-256 hashes. It exclusively reserves both output names before writing data and refuses to overwrite existing files. On a handled failure it removes only outputs created by that invocation; cleanup failures are reported explicitly. An abrupt process or machine termination can still leave an incomplete pair, so verify both files before import. The SQL contains private data: do not commit it or expose it in logs. Plain INSERT statements fail on conflicts; there is deliberately no `OR REPLACE`, deletion or silent merge. Use a verified empty target. Rehearse on staging first.

Run `node --test scripts/test-snapshot-converter.mjs` to check paired creation, existing-file preservation, retry, concurrent invocations and private-log handling.

Apply `migrations/d1/0001_memorial.sql` through Wrangler D1 migrations, then execute the private import file against the explicitly selected staging/production DB. If any import step fails, keep traffic on the source and investigate the target; do not assume an incomplete import is safe to serve.

Export all nine/three target columns into a private JSON object `{memorial_messages: [...], memorial_submission_rate_limits: [...]}`. D1 keeps timestamps as fixed-width UTC text (`YYYY-MM-DDTHH:mm:ss.ffffffZ`), so values must match the source strings without conversion.

```text
node scripts/verify-memorial-snapshot.mjs PRIVATE_SOURCE.json PRIVATE_D1_TABLES.json
```

This validates exact per-table row hashes and counts plus status counts. Row/column ordering does not affect reconciliation; text content, nulls, status, timestamps, notes, fingerprints and quotas all do. Public views intentionally expose only approved messages and four public fields. Source backups remain available until both reconciliation and the live flow pass.

## Concurrency and failure behavior

The old PostgreSQL advisory-lock/transaction becomes a D1 `batch` transaction containing the duplicate decision, conditional insert, and quota update. D1 executes the batch sequentially and rolls it back on any statement failure. This prevents concurrent requests from exceeding the three-per-UTC-hour quota and prevents duplicate requests from consuming it. Ten-minute duplicate detection includes all statuses and treats null locations as equal. UUID tiebreakers and PostgreSQL's descending null-first approval order are retained. Moderation atomically updates pending rows only.

The integration suite exercises simultaneous requests, insert failure, quota-write failure, rollover, duplicate expiry, competing moderation, pagination, and lossless import. The HTTP suite executes the generated Worker in workerd with in-memory D1, synthetic secrets and mocked outbound Turnstile responses. It is not evidence of real CAPTCHA, DNS, provider credentials or production data migration; those require staging/live verification.

## Secret rotation and write freeze

Fresh Cloudflare secrets are used after the Railway incident. Rotating the fingerprint salt changes future IP fingerprints, while imported historical fingerprints remain exactly preserved. With source writes frozen, confirm **both** zero source messages in the preceding ten minutes (all statuses, including the exact cutoff) and zero unexpired UTC-hour quota records with a positive submission count. If either check is nonzero, wait until those records expire and recheck. If both checks are already zero, no arbitrary wait until the next hour is required. Export/reconcile the final data while writes remain frozen. Old sessions will require signing in again with the new admin credentials/session secret.

Do not merge this branch into Railway's watched branch while Git auto-deploy remains enabled. The old `.railway/railway.ts`, PostgreSQL SQL and `db:migrate:legacy:postgres` command are historical references; the working rollback version is commit `e50f2c9`. Once Cloudflare receives new messages, rollback needs a D1 export and reconciliation before directing writes elsewhere.

## Dependency and build notes

Next.js and eslint-config-next were narrowly patched to 16.3.8; source-map-js is 1.2.2. The compatible fflate 0.7.5 override fixes GHSA-px8p-9vwx-vf98 in vinext's OG font tooling. `npm audit` still reports GHSA-vfj7-8cjw-p6xm (braces <=3.0.3) through ESLint/fast-glob and vinext build-time dynamic import tooling; 3.0.3 is the latest published release at this checkpoint. No incompatible downgrade/override is applied. These paths handle trusted source/build globs, not visitor-supplied patterns. Review this residual dependency finding independently; do not describe the audit as clean.

vinext emits upstream sourcemap/ineffective-dynamic-import warnings during build. Server maps remain outside public assets; maps are uploaded to Cloudflare for diagnostics. Actual build and runtime tests, plus preview browser checks, are the release evidence.

Primary references: [Cloudflare Next.js/vinext guidance](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/), [D1 batch transactions](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch), [Cloudflare client-IP headers](https://developers.cloudflare.com/fundamentals/reference/http-headers/#cf-connecting-ip), [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [version URL controls](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/).

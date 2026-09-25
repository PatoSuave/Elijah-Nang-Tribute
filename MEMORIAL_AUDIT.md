# Memorial comment audit — September 24, 2026

## Status

**Independent review: PASS after the user-authorized final repair. Verification
covers the repaired code; a Railway deployment is not part of this audit.**

The audit used a bounded executor (High reasoning) and an independent verifier
(Max reasoning for the authentication/authorization checks). The primary session
performed live read-only checks, dependency maintenance, and browser verification.
After two repair cycles, work paused because a moderation-pagination defect
remained, as required by `codex-orchestration`. The user then explicitly
authorized one additional targeted repair. A Medium executor implemented it;
a separate High verifier reviewed the frozen candidate. The primary session
also verified the repaired flow in the browser and ran the production build.

Baseline: `main`, `9343b1bda3abaf19d945b06435413d75f6f7941d`, matching
`origin/main` when checked. Production was last observed on Railway deployment
`33fdf939-f760-4501-983b-31f0df07c926`.

## Resolved pagination blocker

### P2 — Moderating a message could make the next queue page skip pending entries

Original reproduction, independently performed on an isolated local database:

1. Create 26 pending messages, ordered newest first.
2. Page 1 displays messages 0–24; message 25 is on the next page.
3. Approve message 0. The client removes it locally, while the page's older-page
   link still points to page 2 (database offset 25).
4. Follow **Older submissions**. Message 25 is absent, although its database
   status is still `pending`.
5. Reload page 1. Message 25 now appears there.

No message is deleted or made public by this defect. It can nevertheless cause
an administrator to overlook messages or incorrectly see an empty queue.

Relevant code:

- `src/components/AdminMemorial.tsx`: successful moderation removes one local
  item without reconciling the remaining server queue or pagination.
- `src/app/admin/memorial/page.tsx`: pages use fixed 25-item offsets.
- `src/lib/database.ts`: the pending queue uses SQL `LIMIT`/`OFFSET`.

Resolution: successful approval or rejection now fully reloads the canonical
`/admin/memorial` page. The queue entries and page links are fetched together
again, including the message shifted from the next page. The client no longer
keeps a locally shortened copy of the old page, and controls remain disabled
while navigating. Failed moderation retains the page and re-enables controls.

The deliberate tradeoff is returning to page 1 after each successful review.
This avoids preserving a stale offset. A narrowly documented Next.js navigation
lint exception permits that full reload. Old later-page URLs now say only that
the current page is empty and retain a link to newer submissions, rather than
incorrectly claiming the entire queue is empty.

Browser regression results on the frozen repair:

- With 26 pending messages, approving the first loaded the previously skipped
  26th message into page 1; 25 pending entries and no older-page link remained.
- Repeating the boundary with rejection produced the same correct result.
- A 51-message queue could be traversed to page 3. Rejecting its sole message
  returned to a populated page 1 instead of falsely reporting an empty queue.
- Returning to the obsolete page-3 URL displayed page-specific empty text and
  a working newer-page link.
- A concurrent-review conflict displayed its error, retained page 2, and
  re-enabled controls without falsely treating the action as successful.
- Approving the final pending message displayed an empty queue with no page
  links; this persisted after reload.

These final browser checks used the in-app browser because the Chrome automation
connection was unavailable. Earlier mobile checks used Chrome.

## Verified fixes

- Clear client validation and field focus for missing name/message/consent;
  preserves written text when submission fails.
- Request-in-flight guards, bounded network waits, and usable retry feedback.
- Resets single-use Turnstile tokens after attempted submissions; handles
  widget cleanup, expiry, loading errors, and navigation/remounts.
- Rejects null/non-object submission payloads with 400 instead of an unhandled
  server error.
- Transactional duplicate suppression for identical submissions from the same
  salted fingerprint within ten minutes, without consuming an extra quota slot.
- Public reads use `no-store` so a new read reflects moderation immediately.
- Distinguishes stale moderation conflicts from database failures and rejects
  malformed message identifiers.
- Hides the floating music player on admin routes, fixes homepage navigation
  from the admin page, and prevents long names/messages from overflowing cards.
- Refreshes the entire moderation queue after each successful review, preventing
  offset-pagination skips and misleading later-page empty states.
- Compact verification widget and constrained form grid fit a 320-pixel viewport.
- Corrects the local-development origin comparison when Next.js canonicalizes
  `127.0.0.1` requests as `localhost`; production still requires the configured
  HTTPS origin and ignores supplied Host/forwarded-host values.
- Updates Next.js and its ESLint configuration to 16.3.6, PostCSS to 8.5.28,
  and affected transitive dependencies. Full `npm audit` reports zero known
  vulnerabilities in this candidate.

No production message data, credentials, database schema, or Railway variables
were changed by this audit. Existing repository instructions were preserved.

## Verification evidence

Local checks on the final candidate:

- `npm test`: 13/13 passed.
- `npm run lint`, `npm run build`, and `git diff --check`: passed.
- `npm run test:memorial:integration`: passed against an isolated, loopback
  PGlite PostgreSQL-compatible database.
- Independent HTTP checks: invalid/non-JSON input, missing consent, honeypot,
  oversized message, cross-origin requests, unauthorized moderation, invalid
  password, missing CSRF token, stale moderation, and rate limits behaved as
  expected.
- Valid submissions remained pending/private. Only approved entries appeared
  publicly; rejected entries remained private. The public response contained
  only display name, location, message, and approval date.
- Duplicate requests were rejected without creating a second row; three unique
  submissions were accepted and the fourth returned 429 with `Retry-After`.
- Browser checks: submission, failure-text preservation, retry after duplicate,
  login, approval, rejection, and persistence after reload passed. Script-like
  text rendered literally rather than executing.
- Mobile checks: approval/rejection controls were usable at 375 pixels; the
  comment form fit at 320 pixels without horizontal overflow; the public music
  player remained available.
- Final independent code review: **passed** against the exact frozen files.
  Primary browser checks verified the repaired pagination and error paths above.
- The final independent verifier also reran the integration script and its own
  isolated 26-message HTTP/database regression. Rejection, refreshed page 1,
  and the empty later-page response passed. All 26 verifier fixtures were
  removed; verifier/integration fixture counts were both zero afterward.

Integration-test invocation in PowerShell (use only a disposable local database):

```powershell
$env:MEMORIAL_INTEGRATION_DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:55439/postgres'
npm run test:memorial:integration
```

The integration script rejects non-loopback hosts, uses random fixture
fingerprints, and removes only its own fixtures. Do not point it at production
through a local tunnel or proxy.

## Live checks and limits

During the earlier live audit at `https://nangsoul-web-production.up.railway.app`,
the health endpoint and
public message endpoint returned 200; the board and authenticated empty
moderation queue loaded. The reported recurring “Messages are temporarily
unavailable” error was not reproduced during those live checks. This does not
rule out an intermittent failure.

Production CAPTCHA-protected submission was not completed: Cloudflare detected
the automated browser. The local end-to-end tests used Cloudflare's official
dummy keys; production verification was not bypassed or weakened. No synthetic
production messages were submitted during this audit.

PGlite does not establish behavior under multiple independent PostgreSQL
backend processes; simultaneous HTTP requests passed locally, but full
production-style database concurrency remains unverified. This was a focused
comment-flow/security-boundary review, not a comprehensive security audit.

Non-blocking development-only hardening: a raw Host value ending in `/` can
normalize to an accepted origin. Production is unaffected. The final candidate
rejects invalid path-bearing/empty Host cases covered by the regression tests.

Email moderation notifications remain outside this candidate and are not
configured by these changes.

The independent verifier removed its exact local fixtures and confirmed none
remained. All browser fixtures existed only in the disposable in-memory local
database; no visitor messages were used or altered.
The temporary development server and in-memory database were then stopped,
discarding the synthetic browser fixtures.

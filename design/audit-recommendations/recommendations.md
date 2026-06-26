# Album Shelf Recommendation Audit

## Audit Scope

- Surface: Elijah Nang tribute homepage / Vercel preview equivalent.
- Goal: recommend next design improvements after the Album Shelf implementation.
- Evidence:
  - `01-home-desktop.png`
  - `02-home-mobile.png`
  - `03-home-desktop-long.png`
  - `04-home-mobile-long.png`
  - Source visual target: `../music-first-archive/album-shelf.png`

## Step List

1. Homepage hero: healthy. Strong editorial hierarchy and clear primary subject.
2. Featured shelf: healthy with polish opportunities. The desktop shelf works; mobile is stable but less shelf-like.
3. Selected works list: healthy. Strong archive structure, clear repeated rows, obvious listen actions.
4. About and link groups: healthy. The compressed biography supports the archive without dominating.
5. Now playing and footer: needs polish. SoundCloud embed loading state is visually loud, and the listening moment arrives late.

## Recommended Changes

1. Fix the primary CTA mismatch.
   - Evidence: `Start Listening` currently leads into the catalog/works area rather than a direct listening moment.
   - Recommendation: either route it to the SoundCloud player/link groups or rename it to `Browse the Archive`.

2. Create or source consistent release cover art.
   - Evidence: several records reuse portrait/studio imagery rather than true release artwork.
   - Recommendation: use real covers where available. If unavailable, generate a coherent set of archive covers with matching art direction and use them only as visual treatments, not fake release data.

3. Make the mobile shelf feel like a shelf again.
   - Evidence: the one-column mobile shelf is stable and readable, but it becomes a long stack.
   - Recommendation: use a horizontally scrollable snap shelf on mobile, with visible partial next-card affordance and no horizontal page overflow.

4. Tame the SoundCloud embed.
   - Evidence: the embedded player can appear as a bright white rectangle while loading, which breaks the dark archive mood.
   - Recommendation: wrap it in a dark loading shell, defer it behind a `Play featured track` button, or use a custom listen card that opens SoundCloud.

5. Integrate the hero portrait more softly.
   - Evidence: the rectangular portrait panel is clean but more boxed than the reference.
   - Recommendation: blend the right edge and bottom into the background, reduce the hard panel read, and let the photo feel more editorial.

6. Improve small text contrast and touch comfort.
   - Evidence: small labels and muted body copy are stylish but close to low contrast in the dark theme.
   - Recommendation: lift muted text one step brighter, increase mobile line-height in dense rows, and keep touch targets at least 44px tall.

7. Add a compact archive context module.
   - Evidence: the page explains who Elijah was, but the catalog would benefit from a quick orientation.
   - Recommendation: add a small metadata strip near the shelf: `Albums`, `Beat tapes`, `Visual worlds`, `Primary platforms`.

8. Review LCP image behavior.
   - Evidence: local dev warned that `/images/elijah-artwork.jpg` was detected as LCP in one capture.
   - Recommendation: verify real LCP in production and set the above-the-fold LCP image to eager/preloaded behavior using current Next 16 image guidance.

## Accessibility Risks

- Screenshots cannot confirm keyboard order, focus visibility, or screen reader labels.
- The fixed mini-player could overlap low-left content on small screens.
- External links should keep clear accessible names that include destination context.

## Evidence Limits

- This audit used screenshots and local preview captures only.
- It did not include full keyboard traversal, screen reader testing, or analytics/user behavior.

# Design Continuation

## Current Direction

The selected cleanup path is **Option 2: Music-First Archive** for the Elijah Nang tribute site.

Goal: make the site feel less like a static memorial page and more like a respectful listening archive where visitors quickly understand Elijah Nang, then listen to his work.

## Saved Concepts

Three generated visual directions were saved here:

- `design/music-first-archive/listening-desk.png`
- `design/music-first-archive/album-shelf.png`
- `design/music-first-archive/listening-room.png`

Recommended direction to build first: **Album Shelf**. It makes the music catalog the strongest part of the page while keeping the memorial tone.

## Important Notes

- The generated mockups are visual targets only.
- Do not use the mockup text, years, release names, or fake platform details verbatim.
- Use the real repo content from `src/content/artist.ts`.
- Use the real images already in `public/images/`.
- Preserve the existing external listening links unless deliberately updating content.

## Next Build Pass

Implement the selected concept into the current Next.js one-page site:

- Rework the hero to make music/listening the primary action.
- Make selected works more prominent and easier to scan.
- Use the illustrated artwork and warm portrait colors more intentionally.
- Compress biography/legacy so they support the archive rather than dominate it.
- Keep the footer/legal memorial language respectful and clear.

Before implementation, confirm which concept to build:

1. Listening Desk
2. Album Shelf
3. Listening Room

Current recommendation: **2. Album Shelf**.

## Implementation Status

Implemented **Option 2: Album Shelf** in this working tree.

- Main page: `src/app/page.tsx`
- Global styling: `src/app/globals.css`
- Navigation metadata/layout: `src/app/layout.tsx`
- QA report: `design-qa.md`
- Captures: `design/qa-home-desktop.png`, `design/qa-home-mobile.png`

Notes:

- The build uses real content from `src/content/artist.ts`.
- The build uses real images from `public/images/`.
- `react-icons` was added for platform/action icons.
- Product Design QA passed against `design/music-first-archive/album-shelf.png`.

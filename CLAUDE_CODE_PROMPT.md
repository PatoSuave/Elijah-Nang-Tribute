# Claude Code Prompt

Build a tasteful memorial/archive website for the late music creator Elijah Nang using Next.js, TypeScript, Tailwind CSS, and App Router.

## Project goal
Create a respectful, cinematic, responsive one-page memorial site for nangsoul.com that serves as a bio, archive, and link hub for Elijah Nang’s music and legacy.

## Technical requirements
- Next.js with App Router
- TypeScript
- Tailwind CSS
- Deploy-ready for Vercel
- Fully responsive
- Static site only for v1
- Clean component structure
- SEO metadata and Open Graph tags
- Reusable content-driven architecture
- No CMS
- No backend required

## Design direction
- elegant
- respectful
- atmospheric
- dark theme
- premium editorial feel
- cinematic but restrained
- not flashy
- not commercial
- subtle texture/grain is okay
- typography should feel artistic and archival

## Site sections
1. Hero
   - Elijah Nang
   - memorial subtitle
   - optional ambient visual treatment
   - CTA buttons: Listen, Watch, Explore Legacy

2. About
   - short biography
   - preserve the tone of an artist memorial archive
   - emphasize his identity as an audio novelist and genre-blending creator

3. Featured Works
   - cards for key projects / albums
   - include title, short description, and outbound platform links

4. Listen / Watch
   - link cards for YouTube, Spotify, SoundCloud, Instagram, Twitch, Facebook
   - optionally embed one YouTube video and one Spotify artist embed if done cleanly

5. Legacy
   - narrative section summarizing influence, worldbuilding, and artistic impact
   - layout should feel editorial

6. Footer
   - respectful memorial disclaimer
   - note that the site is unofficial unless otherwise specified

## Content architecture
Create a content file such as `src/content/artist.ts` and keep all artist text, links, featured works, and footer disclaimer there instead of hardcoding into the page.

## Use these links
- YouTube: https://www.youtube.com/@elijahnang90
- Spotify: https://open.spotify.com/artist/0yIO6HI875mLzamqmjjFFU
- SoundCloud: https://soundcloud.com/elijahnang
- Instagram: https://www.instagram.com/elijahnang/
- Twitch: https://www.twitch.tv/nangsoul
- Facebook: https://www.facebook.com/elijahnang91

## Suggested content tone
- respectful
- archival
- emotionally grounded
- centered on preserving access to his public work

## Implementation requirements
- create all starter files
- generate folder structure
- create reusable components
- add metadata
- add favicon placeholder support
- include polished hover states
- keep accessibility in mind
- avoid bloated animation libraries unless needed

## Output requested
Please generate:
1. folder structure
2. all source files
3. sample content in `artist.ts`
4. homepage implementation
5. instructions for local development and GitHub/Vercel deployment

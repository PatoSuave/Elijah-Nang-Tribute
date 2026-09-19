# Deployment Checklist

## 1. GitHub Repo
- Create or open the repository: **Elijah Nang Tribute**
- Add your starter docs
- Add the generated Next.js codebase once Claude Code produces it

## 2. Local Project Setup
- initialize Next.js with TypeScript and Tailwind
- confirm the project runs locally
- verify mobile responsiveness
- review all outbound links
- confirm metadata and favicon placeholders exist

## 3. Commit and Push
- commit the initial codebase
- push to GitHub
- verify the default branch is correct

## 4. Railway Services
- create or open the Railway project
- add a PostgreSQL service and the Next.js application service to the same environment
- import the GitHub repository into the application service
- reference the database service's private `DATABASE_URL` in the application service
- add the remaining secrets from `.env.example`
- confirm the pre-deploy migration and `/api/health` healthcheck configured in `.railway/railway.ts`

## 5. Domain Connection
- add `nangsoul.com` inside the Railway application service settings
- add `www.nangsoul.com` if desired
- add the Railway-provided CNAME and verification TXT records at your registrar
- wait for domain verification

## 6. Final Pre-Launch Review
- check mobile layout
- test all external links
- confirm the disclaimer is visible
- confirm the site does not falsely imply official estate endorsement
- check page title and Open Graph preview
- submit and moderate a test memorial message after the database migration has completed

## 7. Post-Launch Improvements
- add more curated featured works
- refine copy
- add stronger visuals or archival imagery if rights are clear
- improve SEO descriptions
- consider a timeline or discography expansion

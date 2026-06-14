# Project Documentation Index

Complete audit + interview-prep package for the **AI Interview Platform**.

| # | Document | What's inside |
|---|----------|---------------|
| 01 | [Audit Report](01_AUDIT_REPORT.md) | Every issue found, root cause, fix applied, and prioritized recommendations. Start here. |
| 02 | [Architecture](02_ARCHITECTURE.md) | High-level + frontend + backend + DB design, auth flow, state management, patterns, scalability, security, deployment, and full request lifecycle — with ASCII diagrams. |
| 03 | [Interview Prep](03_INTERVIEW_PREP.md) | 100+ project-specific Q&A with follow-ups across frontend, backend, DB, AI, proctoring, security, deployment, testing. |
| 04 | [System Design](04_SYSTEM_DESIGN.md) | Scale to 1M users, caching, sharding/replication, performance, high traffic, production security, trade-offs. |
| 05 | [Resume Content](05_RESUME_CONTENT.md) | ATS bullets, LinkedIn post, STAR story, 30s/1m/3m pitches, keyword bank. |
| 06 | [Cheat Sheet](06_CHEAT_SHEET.md) | One-page rapid recall to skim before the interview. |

## How to use this for interviews
1. Read **02 (Architecture)** until you can draw the box diagram from memory.
2. Drill **03 (Interview Prep)** — say answers out loud; rehearse the follow-ups.
3. Skim **04 (System Design)** and be able to give the "1M users" answer cold.
4. Put a bullet from **05** on your resume; rehearse the 1-minute pitch.
5. The morning of: re-read **06 (Cheat Sheet)** only.

## Required action items from the audit (do these)
1. **Rotate all credentials** that were ever in `server/.env` (it was committed in git history).
2. **Commit the untracking** of `node_modules`/`dist`: `git commit -m "chore: stop tracking build artifacts; fix .gitignore"`.
3. Run `npm install` in both `client/` and `server/` to refresh lockfiles after the dependency removal, then `npm run build` in each to confirm a clean compile.

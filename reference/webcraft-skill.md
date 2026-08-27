# Web Craft — Setup & Development Skill (Phase 2: Website Replication)

## Key Building Rules

- **Faithfully replicate the target site.** Match layout, typography, colors, spacing, animations, responsiveness. Pixel-perfect is the goal.
- **Use original assets when available.** Download and use original images, fonts, icons, videos from the target site. Do NOT substitute placeholders.
- **Preserve the original structure.** Replicate HTML structure, CSS styling, component hierarchy.
- **Creativity comes after replication.** Only add polish after base replication is complete.
- Any AI tool is allowed (Claude, MetaCode, Codex, Gemini)
- Repo must be private in codimango org

## PRD Rules (for human participant)

- Do NOT use Claude/AI to write the PRD
- PRD describes the product as if new, not a replication log
- Replication notes go in SETUP.md, not PRD

## Required Submission Artifacts

- site.toml (with original_url, category="replication")
- PRD.md (non-empty, human-written)
- SETUP.md (non-empty, includes replication process)
- .env.example
- screenshots/ (at least one desktop + one mobile)
- Live deployed URL
- Vercel project transferred to AAI-Web Craft team

## Deployment

Use Vercel CLI: `npx vercel --prod`
Then transfer: Settings → General → Transfer Project → AAI-Web Craft

## Submission

Import at https://www.codimango.com/admin/aai-hackathons/tasks

# Issue tracker: Local Markdown

Issues, PRDs, and implementation notes for this repo live as Markdown files in `.scratch/`.

## Why this repo uses local Markdown

This project is still in rapid product-shaping mode. The team is iterating on positioning, front-end interaction, and AI workflow design quickly, so a local Markdown tracker keeps planning lightweight and easy to evolve inside the repo.

## Conventions

- One initiative per directory: `.scratch/<feature-slug>/`
- The PRD for that initiative is `.scratch/<feature-slug>/PRD.md`
- Implementation issues live in `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Triage state is stored as a `Status:` line near the top of each issue file
- Notes, decisions, and follow-up discussion append under a `## Comments` heading

## Suggested structure for this project

- Use initiative folders that match major product tracks such as `scene-generation`, `detail-page-generation`, `gallery-cases`, `frontend-polish`, or `backend-mvp`
- Keep issues narrow and execution-oriented so an agent or human can pick them up without re-reading the entire PRD
- When a task changes product behavior, link it back to the relevant product context in `PRD.md` or discovery notes

## When a skill says "publish to the issue tracker"

Create a new Markdown file inside `.scratch/<feature-slug>/`, creating directories as needed.

## When a skill says "fetch the relevant ticket"

Read the referenced Markdown file directly from `.scratch/`.

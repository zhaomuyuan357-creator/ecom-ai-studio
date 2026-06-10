## Agent skills

### Issue tracker

This repo tracks PRDs, implementation tasks, and follow-up work as local Markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

This repo uses the default five-role triage vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo. Engineering skills should read the root `CONTEXT.md` when it exists, then check `docs/adr/` for architecture decisions relevant to the current area. See `docs/agents/domain.md`.

## Current project resume

When continuing this repo, read these files first:

- `AGENTS.md`
- `CONTEXT.md`
- `docs/current-handoff.md`
- `PROGRESS.md`
- `docs/detail-page-generation-step-plan.md`
- `docs/detail-page-generation-step-05-confirmation-panel.md`
- `docs/detail-page-generation-step-06-hero-generation.md`

## Current product focus

- Project root in active use: `D:\ECONY`
- Active preview target: `http://localhost:3000/`
- The user may still open `file:///D:/ECONY/public/index.html` for visual checking, but real API behavior only works through the local server route above
- Current main work is no longer just Step 6 hero generation
- We are now inside Step 7 detail-page module planning and single-module generation refinement

## Current workflow reality

The current accepted flow is:

1. Read/analyze detail-page input
2. Confirm summary direction
3. Generate hero image only
4. User confirms hero image
5. Enter module planning layer
6. Classify reference images by downstream module
7. Let the user supplement real facts where required
8. Generate detail-page modules one by one
9. Later assemble them into a dedicated detail-page整理页

Do not skip the module planning layer and jump straight to full-batch detail-page generation.

## Current implementation rules

- Keep the current vertical ecommerce direction and light premium visual style
- For detail-page generation, use this priority:
  1. user facts define content truth
  2. reference images define layout and composition
  3. confirmed hero image defines style baseline
  4. AI may only do controlled extension inside those boundaries
- Avoid fabricated specs, certifications, after-sales policies, reviews, variants, or comparison claims
- When a reference image is strongly structured, prefer following its structure over free composition

## Current codebase cautions

- `public/index.html` still contains some legacy duplicate functions and historical layers; always confirm which definition is actually active before editing
- The root app is the active product surface; do not assume `ecom-ai-studio/` is the current target unless the user explicitly redirects work there
- The local worktree may contain unrelated untracked files; do not clean them up unless the user asks

## Current highest-value next steps

- Continue stabilizing Step 7 single-module generation
- Strengthen reference-image inheritance for each module
- Make module outputs more strictly follow reference structure while preserving hero-image style baseline
- Finish the dedicated “一键整理详情页” page instead of leaving it as an inline partial section

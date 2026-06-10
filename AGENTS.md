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
- `PROGRESS.md`
- `docs/current-handoff.md`
- `docs/detail-page-upgrade-optimization-plan.md`
- `docs/detail-page-generation-step-plan.md`
- `docs/detail-page-generation-step-05-confirmation-panel.md`
- `docs/detail-page-generation-step-06-hero-generation.md`

## Current product focus

- Active root workspace: `D:\ECONY`
- Active preview target: `http://localhost:3000/`
- `file:///D:/ECONY/public/index.html` may still be used for rough visual screenshots, but real API behavior only works through the local server route above
- Main work is now inside Step 7 detail-page module planning and single-module generation refinement
- The current highest-value surface is the independent `一键整理详情页` area plus stricter per-module reference inheritance

## Current workflow reality

The accepted workflow is:

1. Read and analyze detail-page input
2. Confirm summary direction
3. Generate hero image only
4. User confirms hero image
5. Enter module planning layer
6. Classify reference images by downstream module
7. Let the user supplement real facts where required
8. Generate detail-page modules one by one
9. Assemble them into a dedicated detail-page arrangement page

Do not skip the module-planning layer and jump straight to full-batch detail-page generation.

## Current implementation rules

- Keep the current vertical ecommerce direction and light premium visual style
- For detail-page generation, always use this priority:
  1. user facts define content truth
  2. reference images define layout and composition
  3. confirmed hero image defines style baseline
  4. AI may only do controlled extension inside those boundaries
- Avoid fabricated specs, certifications, after-sales policies, reviews, variants, or comparison claims
- When a reference image is strongly structured, prefer following its structure over free composition
- Incompatible or risky reference images should be blocked or downgraded instead of being blindly inherited
- Do not expose raw prompts, internal English generation instructions, or technical copy to customers
- If a module or reference indicates pure-image output, do not force text onto the image
- If a reference has a visible designed text area, the system should detect and preserve that text-layout signal

## Current codebase cautions

- `public/index.html` still contains legacy duplicate functions and historical layers; always confirm which definition is actually active before editing
- The root app is the active product surface; do not assume `ecom-ai-studio/` is the current target unless the user explicitly redirects work there
- The local worktree may contain unrelated untracked files; do not clean them up unless the user asks
- When staging or committing, do not accidentally include unrelated untracked files such as old subdirectories or temporary images

## Current completed progress snapshot

- Step 5 summary confirmation is live
- Step 6 hero generation is live and remains the only first-image checkpoint
- Step 7 module workbench is live
- Reference-image classification exists and supports compatibility metadata plus text-area metadata
- Formal single-module generation exists for selling-points, details, params, scenes, variants, trust, after-sales, demo, comparison, size-guide, bundle, and reviews
- Module generation now filters blocked risky references, deduplicates reference images, and hides customer-facing prompt internals
- Module text handling now supports:
  - auto text
  - manual text
  - pure image / no text
  - text position hint
  - user note
- Supplemental fields now support AI one-click grounded suggestion generation
- `一键整理详情页` now has a first independent page-level stacked preview, but still needs polish and full verification

## Current highest-value next steps

- Align the new staged upgrade plan in `docs/detail-page-upgrade-optimization-plan.md` and follow it phase by phase
- Verify in browser that module generation truly follows module visual focus, text mode, and reference structure
- Keep strengthening per-module reference inheritance, especially for detail/craftsmanship modules
- Improve spacing, alignment, and mobile presentation inside the Step 7 workbench
- Continue refining the independent `一键整理详情页` page so users can preview and download the whole arranged page comfortably
- Reduce legacy duplicate-function risk in `public/index.html` without destabilizing the accepted workflow

## Agent skills

### Issue tracker

This repo tracks PRDs, implementation tasks, and follow-up work as local Markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

This repo uses the default five-role triage vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo. Engineering skills should read the root `CONTEXT.md` when it exists, then check `docs/adr/` for architecture decisions relevant to the current area. See `docs/agents/domain.md`.

## Current project resume

When continuing this repo, read these files first:

- `AGENTS.md` — project overview and current rules
- `CONTEXT.md` — product context
- `PROGRESS.md` — full progress log
- `docs/current-handoff.md` — latest handoff status
- `docs/detail-page-upgrade-optimization-plan.md` — 7-stage upgrade plan (current roadmap)
- `docs/detail-page-generation-step-plan.md` — original step plan
- `docs/detail-page-generation-step-05-confirmation-panel.md` — Step 5 details
- `docs/detail-page-generation-step-06-hero-generation.md` — Step 6 details

## Current product focus

- Active root workspace: `D:\ECONY`
- Active preview target: `http://localhost:3000/`
- `file:///D:/ECONY/public/index.html` may still be used for rough visual screenshots, but real API behavior only works through the local server route above
- Main work is now inside **Step 7** detail-page module planning and single-module generation refinement
- Current upgrade phase: **第 1 阶段 — 修通关键断路点** (see `docs/detail-page-upgrade-optimization-plan.md`)
- Phase 1 should currently be treated as **in acceptance / regression-repair mode**, not fully closed; restore broken accepted flows first, then re-verify before reopening wider upgrades
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
- During refactors or cleanup, do not change already accepted and working flows unless the change is strictly necessary to fix the current bug; prefer minimal targeted patches over broad rewrites
- When fixing regressions, prefer restoring the last accepted behavior first; do not combine regression repair with opportunistic Phase 2+ cleanup
- The root app is the active product surface; do not assume `ecom-ai-studio/` is the current target unless the user explicitly redirects work there
- The local worktree may contain unrelated untracked files; do not clean them up unless the user asks
- When staging or committing, do not accidentally include unrelated untracked files such as old subdirectories or temporary images

## Current completed progress snapshot

- Step 5 summary confirmation is live and accepted
- Step 6 hero generation is live and accepted as the only first-image checkpoint
- Step 7 module workbench is live with 8 required + 5 optional modules
- Reference-image classification exists with field mapping, compatibility risk, inheritance mode, warning, and text-area metadata
- Formal single-module generation exists for: selling-points, details, params, scenes, variants, trust, after-sales, demo, comparison, size-guide, bundle, and reviews
- Module generation filters blocked risky references, deduplicates reference images, and hides customer-facing prompt internals
- Module text handling supports: auto text, manual text, pure image / no text, with position hint, user text, and note/override
- Supplemental fields support AI one-click grounded suggestion generation via `/api/suggest-detail-module-field`
- `一键整理详情页` has a first page-level stacked preview; still needs polish
- Recent regression repairs restored the Step 7 start entry and reconnected the `统一导出详情页` button so the export area can open even when only the hero baseline exists
- Staged upgrade governance document exists: `docs/detail-page-upgrade-optimization-plan.md` with 7 phases

## Current upgrade roadmap

Follow `docs/detail-page-upgrade-optimization-plan.md` phase by phase. **Do not skip phases.**

| 阶段 | 内容 | 状态 |
|------|------|------|
| **1** | 修通关键断路点（按钮接通、模块生成入口、统一导出） | **⬅️ 当前** |
| 2 | 状态管理 + 前端布局稳定性 | 待做 |
| 3 | 重做视觉风格约束 | 待做 |
| 4 | 重做模块生成质量 | 待做 |
| 5 | 重做智能优化提示词系统 | 待做 |
| 6 | 老板模式 / 一键整套详情页 | 待做 |
| 7 | 模型解耦与可替换架构 | 待做 |

## Current highest-value next steps (第 1 阶段)

1. 接通场景使用图正式生成
2. 补齐所有模块正式生成入口
3. 接通 `AI 一键生成`、`保存这项`、`导出摘要` 按钮
4. 主动作按钮统一紫色风格
5. `一键整理详情页` 改名为 `统一导出详情页`，不要求全部模块先生成完成
6. 验收通过后才能进入第 2 阶段

## Current acceptance focus

- Verify through `http://localhost:3000/`, not static file preview
- Re-check the exact accepted chain:
  1. summary confirm
  2. hero generate
  3. hero approve
  4. Step 7 planner start
  5. workbench open
  6. `统一导出详情页` opens even if only hero exists
- If any accepted chain breaks, fix only that broken path first before resuming broader upgrade work

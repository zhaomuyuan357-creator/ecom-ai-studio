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
- `file:///D:/ECONY/public/index.html` can still be used for rough screenshots, but real API behavior must be verified through the local server route above
- Main work is inside **Step 7** detail-page module planning, reference-image classification, supplemental fact completion, single-module generation, and dedicated detail-page assembly
- The current highest-value surface is the Step 7 workbench plus the dedicated `统一导出详情页` area

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
- During refactors or cleanup, do not change already accepted and working flows unless the change is strictly necessary to fix the current bug
- Prefer minimal targeted patches over broad rewrites
- When fixing regressions, prefer restoring the last accepted behavior first; do not combine regression repair with opportunistic wide cleanup
- The root app is the active product surface; do not assume `ecom-ai-studio/` is the current target unless the user explicitly redirects work there
- The worktree contains unrelated untracked files, screenshots, and temp assets; do not clean them up unless the user asks
- When staging or committing, do not accidentally include unrelated temp files, old subdirectories, or visual test images

## Current status judgment

### Whole project

- The project is **not in green acceptance state yet**
- The product direction is now clear
- Step 5, Step 6, and the Step 7 workbench architecture are in place
- But `public/index.html` still has historical encoding/script corruption, so browser acceptance cannot yet be treated as fully closed
- The current real task is: **finish the small frontend script structure repair, then re-run browser acceptance on the accepted chain**

### Phase 1

- Status: **not closed**
- Judgment: **implemented a lot, but still in regression-repair / acceptance-repair mode**
- Meaning:
  - key accepted links were reconnected
  - `统一导出详情页` can reopen with hero-only baseline
  - but the frontend script is still being repaired, so Phase 1 cannot be marked fully accepted yet

### Phase 2

- Status: **partially touched, not formally accepted**
- Judgment: **some state/layout stabilization work exists, but do not treat Phase 2 as fully closed**
- Meaning:
  - some UI/state stability work happened in practice
  - but it was not completed as a clean, isolated acceptance phase
  - do not reopen Phase 2 as a broad cleanup right now

### Phase 3

- Status: **first batch implemented**
- Judgment: **code-level complete for the first slice, browser-level acceptance still pending**
- Implemented:
  - richer detail style cards
  - custom style note
  - `getEffectiveDetailStyle()`
  - style inheritance across summary, hero, workbench, and export

### Phase 4

- Status: **first batch implemented**
- Judgment: **code-level complete for the first slice, browser/module acceptance still pending**
- Implemented:
  - stronger module quality guardrails
  - better reference-structure inheritance hints
  - stronger constraints for `variants` and `details`
- Important note:
  - `variants` is currently judged as a **current-model limitation item**
  - `details` is currently judged as a **current-model limitation item**
  - do not keep sinking time into soft prompt tweaks for those two on the current model

### Phase 5

- Status: **started and partially implemented, not closed**
- Judgment: **the first core slice is done, but blocked by old frontend script corruption**
- Implemented:
  - scene prompt optimization strengthening
  - detail prompt optimization draft layer
  - editable summary-to-hero draft flow
  - hero generation now uses effective prompt draft logic
- Not yet closed because:
  - the frontend script is still being structurally repaired
  - browser acceptance for the Phase 5 surfaces is not finished

## Current completed progress snapshot

- Step 5 summary confirmation is live and accepted as product structure
- Step 6 hero generation is live and accepted as the only first-image checkpoint
- Step 7 module workbench is live with required and optional modules
- Reference-image classification exists with field mapping, compatibility risk, inheritance mode, warning, and text-area metadata
- Formal single-module generation exists for:
  - `selling-points`
  - `details`
  - `params`
  - `scenes`
  - `variants`
  - `trust`
  - `after-sales`
  - `demo`
  - `comparison`
  - `size-guide`
  - `bundle`
  - `reviews`
- Module generation filters risky references, deduplicates references, and hides prompt internals from customers
- Module text handling supports auto text, manual text, no text, position hint, user text, and note/override
- Supplemental fields support AI one-click grounded suggestion generation via `/api/suggest-detail-module-field`
- `统一导出详情页` has an early stacked preview/assembly area, but still needs final validation and polish
- Phase 5 first slice exists in code:
  - editable detail prompt draft
  - draft apply/reset actions
  - hero generation using effective draft
- Ongoing small frontend script structure repair has already cleared many historical syntax breakpoints in `public/index.html`

## Current upgrade roadmap

Follow `docs/detail-page-upgrade-optimization-plan.md` phase by phase. Do not skip phases.

| Phase | Content | Current judgment |
|------|------|------|
| 1 | Repair broken critical links | In repair / acceptance mode, not closed |
| 2 | State management + frontend layout stability | Partially touched, not formally closed |
| 3 | Rebuild visual style constraints | First slice implemented, pending acceptance |
| 4 | Rebuild module generation quality | First slice implemented, pending acceptance |
| 5 | Rebuild smart prompt optimization system | Started, first slice implemented, not closed |
| 6 | Boss mode / one-click whole detail page | Not started |
| 7 | Model decoupling and replaceable architecture | Not started |

## Current highest-value next steps

1. Continue the small frontend script structure repair in `public/index.html`
2. Keep using `node --check` on the extracted script after each small patch
3. Finish making the main script syntactically recoverable
4. Then re-run the accepted browser chain through `http://localhost:3000/`
5. Only after that, resume focused acceptance for Step 7 and later phase work

## Current acceptance focus

Verify through `http://localhost:3000/`, not static file preview.

Re-check this exact accepted chain:

1. summary confirm
2. hero generate
3. hero approve
4. Step 7 planner start
5. workbench open
6. `统一导出详情页` opens even if only hero exists

If any accepted chain breaks, fix only that broken path first before resuming broader work.

## How To Continue In A New Chat

Use this exact resume pattern:

```text
先读 AGENTS.md、CONTEXT.md、PROGRESS.md、docs/current-handoff.md、docs/detail-page-upgrade-optimization-plan.md、docs/detail-page-generation-step-plan.md、docs/detail-page-generation-step-05-confirmation-panel.md、docs/detail-page-generation-step-06-hero-generation.md，然后继续当前项目。

当前基线：
1. 活跃根目录是 D:\ECONY，不是旧的 ecom-ai-studio 子目录
2. 当前流程已经进入 Step 7：模块规划 + 参考图归类 + 单模块正式生成
3. 不要跳过当前规划层直接做整套批量详情页
4. 当前规则是：用户资料定事实、参考图定版式、首图定基调、AI 受控发挥
5. 先遵循 docs/detail-page-upgrade-optimization-plan.md 的阶段顺序推进
6. 当前 Phase 1 还不能算关闭，因为 public/index.html 正在做小范围前端脚本结构修复
7. 当前要优先回归验证这条链路：摘要确认 → 首图生成 → 首图确认 → Step 7 工作台 → 统一导出详情页
8. 当前正在做的具体任务是：继续按最小定点修补，清掉 public/index.html 里历史乱码导致的脚本断点；每修一小块就重新跑 node --check，直到整个主脚本通过
9. Phase 3 和 Phase 4 的第一批代码已落地，但浏览器验收未完全关闭
10. Phase 5 已开始并完成第一批核心能力，但还不能算关闭
```


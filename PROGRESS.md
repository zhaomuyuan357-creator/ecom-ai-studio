# Ecom AI Studio Progress

## Quick Resume

If you start a new conversation, read these files first:

- `AGENTS.md`
- `CONTEXT.md`
- `PROGRESS.md`
- `docs/current-handoff.md`
- `docs/detail-page-upgrade-optimization-plan.md`
- `docs/detail-page-generation-step-plan.md`
- `docs/detail-page-generation-step-05-confirmation-panel.md`
- `docs/detail-page-generation-step-06-hero-generation.md`

Suggested resume prompt:

```text
先读 AGENTS.md、CONTEXT.md、PROGRESS.md、docs/current-handoff.md、docs/detail-page-upgrade-optimization-plan.md、docs/detail-page-generation-step-plan.md、docs/detail-page-generation-step-05-confirmation-panel.md、docs/detail-page-generation-step-06-hero-generation.md，然后继续当前项目。

当前基线：
1. 活跃根目录是 D:\ECONY，不是旧的 ecom-ai-studio 子目录
2. 当前流程已经进入 Step 7：模块规划 + 参考图归类 + 单模块正式生成
3. 不要跳过当前规划层直接做整套批量详情页
4. 当前规则是：用户资料定事实、参考图定版式、首图定基调、AI 受控发挥
5. 先遵循 docs/detail-page-upgrade-optimization-plan.md 的阶段顺序推进
6. 当前 Phase 1 还没关闭，因为 public/index.html 正在做小范围前端脚本结构修复
7. 当前优先回归链路：摘要确认 → 首图生成 → 首图确认 → Step 7 工作台 → 统一导出详情页
8. 当前具体任务：继续按最小定点修补，清掉 public/index.html 里的历史乱码断点；每修一小块就重新跑 node --check，直到脚本通过
9. Phase 3 和 Phase 4 的第一批代码已落地，但浏览器验收未完全关闭
10. Phase 5 已开始并完成第一批核心能力，但还不能算关闭
```

## Project Snapshot

- Project: `Ecom AI Studio`
- Active workspace: `D:\ECONY`
- Active preview target: `http://localhost:3000/`
- Product direction: vertical AI workflow for ecommerce sellers
- Core promise: from white-background product image to scene image and structured detail-page materials

## Whole Project Judgment

- The project direction is clear, and the core workflow architecture for Step 5 / Step 6 / Step 7 is already in place
- The project is **not yet in full acceptance state**
- The current real blocker is not only output quality, but also historical script corruption inside `public/index.html`
- Current highest-value work is:
  - finish the small frontend script structure repair
  - then re-run the accepted browser chain
  - then continue focused Step 7 / phase acceptance

## Phase Status Judgment

### Phase 1

- Status: **not closed**
- Judgment: implemented a lot, but still in regression-repair / acceptance mode
- Reason:
  - several accepted links were repaired
  - `统一导出详情页` re-entry was reconnected
  - but the main frontend script is still being repaired, so this phase cannot yet be marked fully accepted

### Phase 2

- Status: **partially touched, not formally accepted**
- Judgment: some stabilization happened in practice, but this phase was not cleanly completed as an isolated acceptance phase

### Phase 3

- Status: **first slice implemented**
- Judgment: code-level complete for first slice, browser acceptance still pending

### Phase 4

- Status: **first slice implemented**
- Judgment: code-level complete for first slice, browser/module acceptance still pending
- Current-model limitation tags:
  - `variants`
  - `details`

### Phase 5

- Status: **started and partially implemented**
- Judgment: first core slice is done, but not closed
- Reason:
  - editable prompt draft layer exists
  - scene/detail prompt optimization logic has been strengthened
  - but old script corruption still blocks full browser-level closure

## Current Stage

The active stage is now:

- Step 7 detail-page module planning
- reference-image classification
- supplemental fact collection
- single-module real generation
- dedicated detail-page assembly workflow
- plus small frontend script structure repair to recover the main page script

## What Has Been Completed

### 1. Step 5 summary confirmation

- summary confirmation area is live
- revision loop is live
- revision payload includes structured feedback fields

### 2. Step 6 hero generation

- `/api/generate-detail-hero` is live
- summary approval unlocks hero generation
- hero result supports continue / redo / go-back adjustment
- hero-only generation remains the accepted first visual checkpoint

### 3. Step 7 planning layer

- after hero approval, the flow enters a module planning layer instead of full-batch detail-page generation
- planning layer is split into required and optional modules
- required/optional visual labels are aligned to the current product style

### 4. Reference-image classification

- top-level detail reference input supports multiple images
- backend classification endpoint exists:
  - `/api/classify-detail-reference-assets`
- classification includes:
  - field mapping
  - compatibility risk
  - inheritance mode
  - warning
  - text-area metadata
- UI supports manual reassignment
- risky references can now be blocked from formal downstream generation

### 5. Supplemental info and image recognition

- module supplemental text fields are live
- module-level image upload and auto-recognition are live
- module-level extra reference-image upload is live
- supplemental fields support grounded AI suggestion generation

### 6. Real module generation endpoints

The system can now generate these module types through `/api/generate-detail-module`:

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

### 7. Generation normalization rules

Module generation is explicitly constrained by:

- user facts define content truth
- reference images dominate layout and composition
- confirmed hero image defines style baseline only
- AI is allowed only controlled extension inside those boundaries

### 8. Module text handling

- each module can choose:
  - auto text
  - manual text
  - pure image / no text
- text handling supports:
  - position hint
  - user text
  - note / override
- if a reference visibly contains a designed text area, the system tries harder to preserve that signal

### 9. Customer-facing cleanup

- raw generation prompts are no longer shown to customers in the hero or module result areas
- customer-facing copy is more Chinese-first and less technical

### 10. Assembly workflow

- `统一导出详情页` has an early stacked arrangement area
- users can preview current completion state and download modules one by one
- this still needs final browser-level validation and polish

### 11. Phase 3 first slice

- richer style cards
- custom style note
- `getEffectiveDetailStyle()`
- style inheritance across summary, hero, workbench, and export
- backend style execution strengthened in `server.js`

### 12. Phase 4 first slice

- stronger module quality guardrails
- stronger anti-poster / anti-duplicate rules
- stronger targeted constraints for `variants`
- stronger targeted constraints for `details`
- reference-structure inheritance hints passed end-to-end

### 13. Phase 5 first slice

- scene prompt optimization strengthened
- detail prompt optimization draft layer added
- summary original draft and editable optimized draft are separated
- hero generation now uses effective prompt draft logic
- summary UI now includes editable prompt draft editor with apply/reset actions

## Current Script-Repair Progress

Current work has focused on making the main script in `public/index.html` syntactically recoverable again.

Already repaired in this loop:

- broken `GALLERY` block
- broken `currentSettings` and constant block
- damaged result placeholder / result loading / result error / result success copy
- damaged detail read result rendering
- damaged revision summary / revision panel
- damaged summary main rendering
- damaged approval-state rendering
- damaged confirmation toast copy
- damaged reference-classification warning copy
- damaged reference-structure hints
- damaged module text config
- damaged supplemental summary / supplemental panel / inline quick fill
- multiple Phase 5 draft-layer related areas were preserved while doing these repairs

Current latest syntax status:

- `node --check` on extracted script still does **not** fully pass yet
- latest first error has already moved much further down the file into later Step 7 / assembly rendering zones
- this means the repair direction is working, but the script is not fully recovered yet

## Current UX Notes

What is working better now:

- workflow feels closer to real ecommerce production
- hero approval meaningfully gates later module work
- module planning and reference classification are visible
- risky references are less likely to drag output into poster-like degradation
- prompt draft editing exists for detail hero generation

What is still rough:

- browser verification is still needed after the latest script repair
- `public/index.html` still has legacy duplicate layers and historical corruption
- arrangement page still needs final polish
- some modules remain limited by current model behavior

## Important Files

- `public/index.html`
- `server.js`
- `AGENTS.md`
- `CONTEXT.md`
- `PROGRESS.md`
- `docs/current-handoff.md`
- `docs/detail-page-upgrade-optimization-plan.md`
- `docs/detail-page-generation-step-plan.md`
- `docs/detail-page-generation-step-05-confirmation-panel.md`
- `docs/detail-page-generation-step-06-hero-generation.md`

## Open Risks

- stale local server state may make behavior look older than current code
- duplicate function layers in `public/index.html` can still cause confusing overrides
- script-repair work is still incomplete until `node --check` fully passes
- `variants` is a current-model limitation item
- `details` is a current-model limitation item
- arrangement/export area still needs final browser validation

## Recommended Next Steps

### Priority 1

Continue the small frontend script structure repair:

- keep fixing the current first syntax breakpoint in `public/index.html`
- after every small patch, extract the script and rerun `node --check`
- continue until the full script passes

### Priority 2

After script recovery, rerun browser acceptance through `http://localhost:3000/`:

- summary confirm
- hero generate
- hero approve
- Step 7 planner start
- workbench open
- `统一导出详情页` opens even with hero-only baseline

### Priority 3

Then continue focused module validation on:

- `params`
- `scenes`
- `trust`

Keep `variants` and `details` tagged as current-model limitation items until model replacement or later template-controlled strategy work.


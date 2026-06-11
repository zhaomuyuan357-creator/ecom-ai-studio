# Ecom AI Studio Progress

## Quick Resume

If you are starting a new conversation, read these files first:

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
先读 AGENTS.md、CONTEXT.md、PROGRESS.md、docs/current-handoff.md、docs/detail-page-generation-step-plan.md、docs/detail-page-generation-step-05-confirmation-panel.md、docs/detail-page-generation-step-06-hero-generation.md，然后继续当前项目。

当前基线：
1. 活跃根目录是 D:\ECONY，不是旧的 ecom-ai-studio 子目录
2. 当前流程已经进入 Step 7：模块规划 + 参考图归类 + 单模块正式生成
3. 不要跳过当前规划层直接做整套批量详情页
4. 当前规则是：用户资料定事实、参考图定版式、首图定基调、AI 受控发挥
5. 继续优先完善“一键整理详情页”的独立整理页
6. 继续加强各模块对参考图结构、文字区、视觉重点的遵循
```

---

## Project Snapshot

- Project: `Ecom AI Studio`
- Active workspace: `D:\ECONY`
- Active preview target: `http://localhost:3000/`
- Product direction: vertical AI workflow for ecommerce sellers
- Core promise: from white-background product image to scene image and structured detail-page materials

---

## Current Stage

The active stage is now:

- Step 7 detail-page module planning
- reference-image classification
- supplemental fact collection
- single-module real generation
- early dedicated detail-page assembly workflow

This is still a front-end-led workflow validation phase, but several backend endpoints are already real enough to test module-level output behavior.

---

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
- required modules still allow manual toggle

### 4. Reference-image classification

- top-level detail reference input supports multiple images
- backend classification endpoint exists:
  - `/api/classify-detail-reference-assets`
- classification now includes:
  - field mapping
  - compatibility risk
  - inheritance mode
  - warning
  - text-area metadata
- UI supports manual reassignment
- inheritance is scoped by matching module field instead of globally leaking to every module
- risky references can now be blocked from formal downstream generation

### 5. Supplemental info and image recognition

- module supplemental text fields are live
- module-level image upload and auto-recognition are live
- module-level extra reference-image upload is live
- global reference inheritance into module generation is partially connected and filtered
- supplemental fields now support AI one-click grounded suggestion generation

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

Module generation is now explicitly constrained by these rules:

- user facts define content truth
- reference images dominate layout and composition
- confirmed hero image defines style baseline only
- AI is allowed only controlled extension inside those boundaries

This tightening is especially important for:

- parameter boards
- detail / craftsmanship modules
- trust / certificate layouts
- table-first and proof-first reference boards

### 8. Module text handling

- module text handling now has explicit UI and payload plumbing
- each module can now choose:
  - auto text
  - manual text
  - pure image / no text
- text handling supports:
  - position hint
  - user text
  - note / override
- if a reference visibly contains a designed text area, the system now tries harder to detect and preserve it
- if no text area is recognized, the user can still manually force a text layout instead of being blocked

### 9. Customer-facing cleanup

- raw generation prompts are no longer shown to customers in the hero or module result areas
- customer-facing copy is more Chinese-first and less technical

### 10. Assembly workflow

- `一键整理详情页` now has a first page-level stacked preview
- current implementation can gather hero + generated modules into one ordered arrangement area
- users can preview current completion state and download modules one by one
- this is closer to an independent arrangement page, but still needs polish and full browser verification

### 11. Upgrade governance document

- a new staged upgrade plan now exists:
  - `docs/detail-page-upgrade-optimization-plan.md`
- this document reorganizes current issues into:
  - critical broken links
  - state/layout stability
  - visual-style strengthening
  - module quality strengthening
  - smart prompt optimization
  - boss mode
  - model decoupling
- the project should now follow that staged acceptance order instead of mixing all fixes together

---

## Current UX Notes

What is working better now:

- the workflow feels more like real ecommerce production instead of generic AI generation
- hero approval meaningfully gates later module work
- module planning and reference classification are visible
- risky references are less likely to drag output into poster or repeated nine-grid failure
- module text intent is no longer hardcoded to one path

What is still rough:

- browser verification is still needed after the latest round
- some module outputs may still over-borrow from hero composition if prompt control is not strong enough in real runs
- `public/index.html` still contains legacy duplicate functions and layered history
- the arrangement page still needs visual polish and download/overview refinement
- the newly listed upgrade issues still need to be solved phase by phase under the new plan

---

## Latest Checkpoint

Recent work shifted from broad Phase 2 cleanup back to minimal regression repair because accepted flows were accidentally impacted during refactoring.

What was repaired in the latest checkpoint:

- restored the Step 7 planner start entry by reconnecting the active click path to `refreshDetailModuleWorkbench()`
- fixed the detail hero result rendering path so the stored result view no longer crashes on an undefined `html`
- reconnected the `统一导出详情页` button inside the Step 7 workbench
- confirmed the export-area open path is intended to work even when only the approved hero baseline exists
- added a stronger project rule in `AGENTS.md`: do not move already accepted working flows during cleanup unless it is strictly necessary to fix the current bug

What this means operationally:

- Phase 1 should currently be treated as still under acceptance verification, not cleanly closed
- the immediate priority is restoring and re-verifying accepted broken links, not widening the refactor
- any next chat should preserve this minimal-patch discipline until the browser-verified chain is stable again

---

## Important Files

- `public/index.html`
- `server.js`
- `AGENTS.md`
- `CONTEXT.md`
- `PROGRESS.md`
- `docs/current-handoff.md`
- `docs/detail-page-generation-step-plan.md`
- `docs/detail-page-generation-step-05-confirmation-panel.md`
- `docs/detail-page-generation-step-06-hero-generation.md`

---

## Open Risks

- stale local server state may make behavior look older than current code
- duplicate function layers in `public/index.html` can still cause confusing overrides
- reference inheritance needs continued verification module by module
- text-area detection still needs real-case validation across different reference styles
- arrangement page is improved but not yet fully finalized

---

## Recommended Next Steps

### Priority 1

Start following `docs/detail-page-upgrade-optimization-plan.md`, beginning from the first stage:

- fix critical broken links
- confirm every required button and module generation entry is really connected
- re-verify this exact accepted chain in the browser:
  - summary confirm
  - hero generate
  - hero approve
  - Step 7 planner start
  - `统一导出详情页` open with hero-only baseline

### Priority 2

Verify in the browser that each module truly follows:

- module visual focus
- text mode
- reference structure
- pure-image override

### Priority 3

Polish the dedicated `一键整理详情页` page so users can review the whole arranged detail page more comfortably and download with less friction.

---

## Working Agreement For The Next Chat

Unless the user redirects otherwise:

- continue working in `D:\ECONY`
- preserve the current ecommerce-vertical style
- do not skip the module-planning/workbench layer
- do not allow AI to invent hard facts
- treat reference images as stronger than hero composition for layout decisions
- treat hero image as stronger than reference images for style baseline only
- keep customer-facing surfaces Chinese-first and avoid prompt leakage

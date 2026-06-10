# Ecom AI Studio Progress

## Quick Resume

If you are starting a new conversation, read these files first:

- `AGENTS.md`
- `CONTEXT.md`
- `PROGRESS.md`
- `docs/current-handoff.md`
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

Verify in the browser that each module truly follows:

- module visual focus
- text mode
- reference structure
- pure-image override

### Priority 2

Polish the dedicated `一键整理详情页` page so users can review the whole arranged detail page more comfortably and download with less friction.

### Priority 3

Continue reducing legacy duplicate-function risk in `public/index.html` without destabilizing the accepted workflow.

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

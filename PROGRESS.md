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
请先阅读 AGENTS.md、CONTEXT.md、PROGRESS.md、docs/current-handoff.md、docs/detail-page-generation-step-plan.md、docs/detail-page-generation-step-05-confirmation-panel.md、docs/detail-page-generation-step-06-hero-generation.md，然后继续当前项目。
当前重点：继续打磨 Step 7 详情页模块工作台、参考图归类、单模块正式生成，以及“一键整理详情页”的独立整理页。
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

The product is no longer only validating Step 5 and Step 6.

The active stage is:

- Step 7 detail-page module planning
- reference-image classification
- supplemental fact collection
- single-module real generation
- early detail-page assembly workflow

This is still a front-end-led workflow validation phase, but backend generation endpoints are now partially real for module-level output.

---

## What Has Been Completed

### 1. Step 5 summary confirmation

- summary confirmation area is live
- revision loop is live
- revision payload includes structured feedback fields

### 2. Step 6 hero generation

- `/api/generate-detail-hero` is live
- summary approval unlocks hero generation
- hero result now supports:
  - `这张可以继续`
  - `这张还要重做`
  - `回到摘要微调`
- hero-only generation remains the accepted first visual checkpoint

### 3. Step 7 planning layer

- after hero approval, the flow enters a module planning layer instead of full-batch detail-page generation
- planning layer is now split into:
  - 8 required modules
  - 5 optional modules
- required/optional visual labels follow the current purple style
- required modules still allow manual toggle

### 4. Reference-image classification

- top-level detail reference input supports multiple images
- backend classification endpoint exists:
  - `/api/classify-detail-reference-assets`
- current classification keys:
  - `paramSpecs`
  - `variantInfo`
  - `trustInfo`
  - `afterSalesInfo`
  - `comparisonBasis`
  - `sizeGuideInfo`
  - `bundleInfo`
  - `reviewProof`
  - `scenes`
  - `details`
  - `unknown`
- UI supports manual reassignment by chip/button
- inheritance is now scoped by matching module field instead of global inheritance to every module

### 5. Supplemental info and image recognition

- module supplemental text fields are live
- module-level image upload and auto-recognition are live
- module-level extra reference-image upload is live
- global reference-image inheritance into module generation is partially connected and improving

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

Recent rounds moved module generation onto a stricter rule set:

- user facts define content truth
- reference images should dominate layout/composition
- hero image should define style baseline
- AI is only allowed controlled extension inside those boundaries

This shift is especially important for:

- parameter boards
- detail/craftsmanship modules
- trust/certificate layouts
- table-first and proof-first reference boards

### 8. Assembly workflow

- a first-pass “一键整理详情页” entry now exists
- current implementation is still an inline assembly section
- it is not yet the final dedicated整理页 the user wants

---

## Current UX Notes

What is working better now:

- the workflow feels more like real ecommerce production instead of generic AI generation
- hero approval now meaningfully gates later steps
- module planning and reference classification are visible to the user
- module generation is moving toward structure-following output instead of freeform output

What is still rough:

- some module outputs still over-borrow from hero composition instead of following reference structure strongly enough
- `public/index.html` still has legacy duplicate functions and layered history
- “一键整理详情页” is not yet a true dedicated results page
- users may still test through `file://`, which hides real API behavior

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
- assembly page is not yet in final product shape

---

## Recommended Next Steps

### Priority 1

Make each module follow the reference structure more strictly while still preserving hero-image style baseline.

### Priority 2

Finish the dedicated “一键整理详情页” results page so users can gather generated modules in one place and download them efficiently.

### Priority 3

Continue cleaning legacy duplicate logic in `public/index.html` so future edits stop fighting historical layers.

---

## Working Agreement For The Next Chat

Unless the user redirects otherwise:

- continue working in `D:\ECONY`
- preserve the current ecommerce-vertical style
- do not skip the module-planning/workbench layer
- do not allow AI to invent hard facts
- treat reference images as stronger than hero composition for layout decisions
- treat hero image as stronger than reference images for style baseline only

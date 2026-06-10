# Current Handoff

## Read First

Start the next conversation by reading:

- `AGENTS.md`
- `CONTEXT.md`
- `PROGRESS.md`
- `docs/current-handoff.md`
- `docs/detail-page-generation-step-plan.md`
- `docs/detail-page-generation-step-05-confirmation-panel.md`
- `docs/detail-page-generation-step-06-hero-generation.md`

## Current Product Stage

- Project: `Ecom AI Studio`
- Active workspace in use: `D:\ECONY`
- Active preview should be checked through: `http://localhost:3000/`
- Current focus: Step 7 detail-page module planning and single-module generation refinement
- Visual direction must stay in the current light, premium, ecommerce-vertical style

## Current Accepted Progress

- Step 5 summary confirmation is live and accepted
- Step 6 hero generation is live and accepted as the only first-generation image step
- After hero approval, the flow now enters a real Step 7 planning/workbench layer instead of jumping straight to full detail-page batch generation

## What Was Finished In Recent Rounds

- Added post-hero module planning UI
  - `required` modules: 8
  - `optional` modules: 5
  - required and optional group labels are unified to the current purple style
  - required modules still allow manual toggle
  - required group note keeps the “建议自动全部勾选” guidance

- Added reference-image classification workflow
  - top-level detail reference upload supports multiple images
  - backend endpoint: `/api/classify-detail-reference-assets`
  - classification targets:
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
  - UI supports manual reassignment by chip/button instead of native select

- Added single-module supplemental workflow
  - module fields support text supplement
  - module fields support image upload and auto-recognition
  - module fields support extra reference-image upload
  - global reference images are inherited only into matching module fields, not all modules

- Added module workbench generation flow
  - single-module generation can now run for:
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

- Added generation normalization rules
  - user facts define content truth
  - reference images define layout/composition priority
  - approved hero image defines style baseline
  - AI is only allowed controlled extension inside those boundaries

- Added first pass of detail-page assembly UX
  - “一键整理详情页” entry now exists
  - current state is still an inline assembly section, not yet the final dedicated整理页

## Important Current Reality

- If the page is opened as `file:///D:/ECONY/public/index.html`, API calls will not reflect the real backend workflow
- The app must be validated through `http://localhost:3000/`
- The user may still use `file://` for screenshots and rough visual comments, so always verify whether a reported issue is from static preview or real server mode

## Important Current Boundary

Do not collapse the current Step 7 planning/workbench layer into direct full-page batch generation.

The current product direction is:

1. confirm hero
2. plan modules
3. classify references
4. supplement missing real facts
5. generate modules one by one
6. then assemble them into a dedicated detail-page整理页

## Known Current Risks

- `public/index.html` still contains legacy duplicate function layers; later definitions often override earlier ones
- Some user-visible issues may still come from stale local server state
- The “一键整理详情页” flow is only partially complete
- Reference-image inheritance has improved, but each module still needs continued tightening so outputs follow reference structure more strongly

## Recommended Next Step

The next highest-value product move is:

1. keep strengthening module generation normalization
2. make reference images dominate layout/composition more clearly than hero-image structure
3. finish the dedicated detail-page整理页
4. continue reducing legacy duplicate-function risk in `public/index.html`

## Suggested Resume Prompt

```text
先读 AGENTS.md、CONTEXT.md、PROGRESS.md、docs/current-handoff.md、docs/detail-page-generation-step-plan.md、docs/detail-page-generation-step-05-confirmation-panel.md、docs/detail-page-generation-step-06-hero-generation.md，然后继续当前项目。

当前重点：
1. 基于 D:\ECONY 根目录继续，不要切回旧的 ecom-ai-studio 子目录
2. 详情页流程已经进入 Step 7：模块规划 + 参考图归类 + 单模块正式生成
3. 不要跳过当前规划层直接做整套批量详情页
4. 继续强化“用户资料定事实、参考图定版式、首图定基调、AI受控发挥”这套规则
5. 优先把“一键整理详情页”做成真正独立的整理页
```

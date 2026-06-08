# Ecom AI Studio Progress

## Quick Resume

If you are starting a new conversation, read these files first:

- `AGENTS.md`
- `PROGRESS.md`
- `PRD.md`
- `01-discovery/target-audience.md`

Suggested handoff prompt for the next chat:

```text
请先阅读 AGENTS.md、PROGRESS.md、PRD.md、01-discovery/target-audience.md，然后继续当前项目。
当前重点：继续打磨详情页生成工作流，并准备后端 MVP 的接口设计。
```

---

## Project Snapshot

- Project: `ecom-ai-studio`
- Workspace: `D:\ECONY\ecom-ai-studio`
- Current preview: `http://localhost:3000/`
- Product direction: vertical AI tool for e-commerce sellers
- Core users: Taobao / Douyin / 1688 small sellers, small operator teams, non-designers
- Core value: turn white-background product images into scene images and eventually full detail pages

---

## Current Stage

The project is in the front-end validation phase.

We are using a polished local demo to verify:

- product positioning
- workflow feel
- page structure
- gallery case presentation
- detail-page generation interaction

The back end is not the current bottleneck yet. The next best move is still to refine the detail-page workflow one more round, then define and connect a minimal back-end MVP.

---

## What Has Been Completed

### 1. Product and research foundation

- Discovery and PRD have been written
- Target audience is clearly defined
- Product scope is focused on e-commerce vertical use cases instead of generic AI image generation

### 2. Front-end redesign

- The original page was rebuilt into a lighter glassmorphism direction inspired by the reference site
- The site now feels closer to a creator workflow product instead of a generic dashboard
- Current main route is the local static/Express preview at `localhost:3000`

### 3. Core homepage structure

- Hero section
- Create zone
- Inspiration gallery
- Gallery detail modal
- Floating dock / navigation

### 4. Dual-mode workflow

The create area now supports:

- `场景图生成`
- `详情页生成`

Scene mode:

- upload product image
- write scene prompt
- call `/api/generate-scene-fusion`
- render result

Detail mode:

- upload product image
- optional reference image
- competitor URL
- product name
- selling points
- scenes
- audience
- style selection
- extra notes

### 5. Gallery has been retargeted to e-commerce use cases

The gallery is no longer generic inspiration content. It now includes e-commerce-relevant categories and real examples such as:

- holiday lighting scenes
- home/lifestyle product scenes
- beauty product scene
- clothing detail-page case
- LED poster case
- used-car detail-page case

### 6. Gallery detail modal

Clicking a gallery card opens a modal with:

- original image
- generated image
- prompt
- apply prompt
- copy prompt
- share

### 7. Detail-page demo result flow

The detail-page mode currently simulates a proposal flow with:

- `首图确认`
- `卖点模块`
- `整套详情页方案`

Buttons and states have been cleaned up so that:

- regenerate respects the current mode
- result placeholders switch by mode
- download text changes by mode

### 8. Project memory / agent setup

These repo-level context files were added:

- `AGENTS.md`
- `docs/agents/issue-tracker.md`
- `docs/agents/triage-labels.md`
- `docs/agents/domain.md`

This means future chats can re-enter the project from repo files instead of long conversation history.

---

## Current UX Notes

What is working well:

- overall visual direction is approved by the user
- gallery direction feels right
- e-commerce positioning is clearer
- dual-mode front-end now exists and is demoable

What is still rough:

- `详情页生成` result area is still a proposal demo, not yet a convincing long-page visual system
- `下载首图` was patched with a more robust browser fallback, but should be rechecked in the in-app browser
- some earlier text content and legacy encoding history may still exist in old parts of the file

---

## Next Recommended Steps

### Priority 1: make detail-page mode feel real

Upgrade the current 3-card detail result into a more realistic long-form e-commerce structure preview, such as:

- first screen / hero visual
- selling-point module
- material/detail closeups
- size/spec module
- scene usage module
- comparison / proof module
- CTA ending block

### Priority 2: strengthen workflow feeling

The interaction should feel like:

- upload product
- choose style
- confirm first screen
- generate full detail-page set

This is still front-end work, but it is the most valuable pre-backend refinement.

### Priority 3: design backend MVP

After one more round of front-end validation, define the minimal backend:

- scene generation endpoint
- detail-page generation endpoint
- job status endpoint
- history / result storage

---

## Backend Timing

Backend work should begin soon, but not before the detail-page front-end flow is stable enough to avoid immediate rework.

Recommended sequence:

1. finish one more round of detail-page front-end polish
2. write backend API contract
3. implement minimal backend MVP
4. connect front-end to real endpoints

---

## Important Files

- `public/index.html`
- `server.js`
- `PRD.md`
- `01-discovery/target-audience.md`
- `AGENTS.md`
- `docs/agents/issue-tracker.md`
- `docs/agents/triage-labels.md`
- `docs/agents/domain.md`

---

## Open Risks

- If backend is started too early, the detail-page interaction may need to be redone
- The current detail-page result is still presentational rather than production-grade
- The in-app browser may behave differently for download flows than a normal browser
- There may still be old text encoding artifacts in some earlier content

---

## Working Agreement For The Next Chat

Unless the user says otherwise:

- preserve the current visual direction
- keep learning from the reference site
- keep the content focused on e-commerce vertical use cases
- prioritize front-end workflow clarity over premature backend complexity
- treat user-provided images and prompts as gallery case inputs

---

## Immediate TODO

The best next task is:

`继续优化详情页生成结果区，把它从 3 张提案卡片升级成更像真实电商详情页的长图模块预览。`

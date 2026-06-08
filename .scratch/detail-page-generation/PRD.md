# Detail Page Generation

Status: ready-for-agent
Owner: unassigned
Related: `public/index.html`, `server.js`, `PRD.md`, `CONTEXT.md`, `PROGRESS.md`

## Goal

Turn the current `详情页生成` demo flow into a more realistic e-commerce workflow that is strong enough to:

- explain product value clearly
- feel closer to a real seller tool
- support later backend integration with minimal rework

## Why This Matters

Right now the scene-generation side is already understandable, but the detail-page side is still closer to a proposal demo than a believable product workflow.

This is the current highest-value product gap because:

- it is central to the long-term product direction
- it affects how users understand the tool's value
- it should define the backend contract before backend implementation starts

## Current State

The page already supports:

- mode switching between scene generation and detail-page generation
- product image upload
- optional reference upload
- competitor URL input
- product info inputs
- a simulated result area with:
  - 首图确认
  - 卖点模块
  - 整套详情页方案

## Desired Outcome

The detail-page mode should feel like:

1. input product and reference information
2. choose or confirm a direction
3. confirm first-screen style
4. preview a more realistic detail-page structure
5. prepare the app for real backend integration

## Non-Goals

- no full account system
- no production-grade task queue yet
- no full CMS or asset library
- no broad creative editing suite

## Success Criteria

- the result area looks like a real e-commerce detail-page workflow, not placeholder cards
- the interaction clearly communicates a staged generation process
- the front-end structure is stable enough to inform backend API design
- a future chat or agent can continue the work from the linked issue files directly

## Planned Workstreams

1. Upgrade front-end detail result presentation
2. Refine detail workflow states and user feedback
3. Define backend MVP contract for detail-page generation

## Linked Issues

- `issues/01-detail-result-long-preview.md`
- `issues/02-detail-workflow-state-polish.md`
- `issues/03-backend-mvp-api-contract.md`

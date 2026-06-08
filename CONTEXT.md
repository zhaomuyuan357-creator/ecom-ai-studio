# CONTEXT

## Project Identity

`Ecom AI Studio` is a vertical AI workflow product for e-commerce sellers.

It is not a generic AI image playground, and it is not a broad creative suite. Its job is to help small sellers quickly produce better commercial visuals from product assets they already have.

Current product direction:

- white-background product image -> scene image
- white-background product image + reference structure -> full detail-page workflow

---

## Who This Product Is For

Primary users:

- Taobao sellers
- Douyin sellers
- 1688 sellers
- small operator teams
- one-person or two-person shops
- non-designers who do not know Photoshop or prompt engineering

Typical traits:

- care about speed, cost, and conversion
- need usable output fast
- do not want complex creative tooling
- often operate with very limited time and budget

This product should feel accessible to people who can run an online shop, but cannot run a professional design workflow.

---

## Who This Product Is Not For

Not the primary target:

- large brands with internal design teams
- advanced AI creators who want deep model control
- general-purpose image-generation hobby users
- users looking for an all-in-one SaaS marketing platform

If a design or feature choice makes the product feel like a generic AI creation tool, it is probably drifting away from the core market.

---

## Core User Problem

The main user problem is:

Small sellers need product images and detail-page materials that look competitive, but they do not have the time, budget, or skill to produce them consistently.

In plain language, the product helps users:

- make product images look better
- shorten content production time
- lower outsourcing dependence
- reduce visual gap with competitors
- move from “I only have a white-background image” to “I have something I can actually sell with”

---

## Product Promise

The product promise is not “powerful AI”.

The product promise is:

- fast enough for real shop operations
- simple enough for non-designers
- specific enough for e-commerce
- good-looking enough to improve perceived professionalism

The system should feel like an e-commerce content worker, not a research lab.

---

## Current Scope

### In scope now

- scene generation workflow
- detail-page generation workflow
- prompt and structure guidance
- e-commerce gallery cases
- front-end workflow validation
- minimal backend MVP planning

### Likely next

- real detail-page generation pipeline
- history / result management
- backend job orchestration
- API contract design

### Explicitly out of scope for now

- broad social content platform features
- full account system
- full billing platform
- large-team enterprise workflow
- complex creative editing suite
- mobile app

---

## Product Shape

The current product should be understood as a creator workflow with two main modes:

1. `场景图生成`
Meaning: convert a white-background product image into a usable scene image.

2. `详情页生成`
Meaning: use product input plus reference structure to move toward a complete e-commerce detail-page asset set.

The second mode is not just “generate another image”. It represents a larger workflow:

- collect product information
- learn from reference structure
- confirm first-screen direction
- generate the rest of the detail-page system

---

## UX Principles

When making design or product decisions, prefer:

- workflow clarity over feature density
- e-commerce specificity over generic AI language
- conversion-oriented output over artistic freedom
- guided input over blank-canvas complexity
- credibility over flashy experimentation

The user should feel:

- “I can use this”
- “this understands my product business”
- “this is faster than outsourcing”
- “this helps me sell, not just generate”

---

## Visual Principles

The approved direction is a light glassmorphism creator experience inspired by the chosen reference workflow.

Current guidance:

- premium, soft, intentional, modern
- closer to a creator/product tool than a dark dashboard
- avoid template-looking layouts
- keep the gallery and examples e-commerce-specific

Do not drift back toward:

- generic dark SaaS dashboard styling
- generic AI art generator aesthetics
- broad lifestyle inspiration unrelated to e-commerce selling use cases

---

## Domain Vocabulary

Use these terms consistently.

### Preferred terms

- `scene generation`
- `detail-page generation`
- `white-background product image`
- `gallery case`
- `selling points`
- `first-screen confirmation`
- `detail-page structure`
- `small seller`
- `operator`
- `conversion`

### Meaning of important terms

`scene generation`
: turning a white-background product image into a more saleable scene image.

`detail-page generation`
: generating the structure and visual modules for an e-commerce detail page, not just a single standalone image.

`gallery case`
: a real or representative e-commerce example with original image, generated result, and prompt/idea.

`first-screen confirmation`
: the step where the user confirms the direction of the hero visual before the whole detail-page set is produced.

`selling points`
: the product advantages the page must communicate clearly enough to support conversion.

### Terms to avoid when possible

- “AI art”
- “creative inspiration platform”
- “image playground”
- “design for everyone” as a vague slogan

These are too broad and weaken the e-commerce focus.

---

## Current Technical Shape

Current implementation shape:

- local Express server
- static front-end page in `public/index.html`
- browser preview at `http://localhost:3000/`

Important implementation reality:

- the front end is ahead of the backend
- the current detail-page mode is still a high-quality demo workflow
- backend should follow the validated UX, not define it too early

---

## Decision Rules

When unsure between two options, prefer the one that:

1. makes the product more useful to small e-commerce sellers
2. makes the workflow easier to understand at a glance
3. improves the realism of the selling workflow
4. avoids turning the product into a generic AI tool

If a new idea is interesting but not clearly tied to e-commerce conversion workflows, it is probably lower priority.

---

## Current Priority

The current highest-priority product task is:

Make `详情页生成` feel like a real e-commerce workflow, not a placeholder demo.

That usually means improving:

- result presentation
- long-form detail-page structure preview
- first-screen confirmation flow
- generated module logic
- backend interface planning for the MVP

---

## Handoff Rule

If a future agent or conversation continues this project, it should first read:

- `AGENTS.md`
- `PROGRESS.md`
- `PRD.md`
- `01-discovery/target-audience.md`
- this file, `CONTEXT.md`

Then it should preserve:

- the current visual direction
- the vertical e-commerce positioning
- the dual workflow structure
- the priority order of front-end validation before backend expansion

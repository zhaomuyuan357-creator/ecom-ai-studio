# Domain Docs

How engineering skills should consume this repo's domain documentation when working in the codebase.

## Repo layout

This is a single-context product repo.

When exploring the project, treat the app as one coherent domain: an AI-assisted e-commerce content workflow for small sellers and operators.

## Before exploring, read these

- `CONTEXT.md` at the repo root when it exists
- `PRD.md` at the repo root for current product direction and scope
- `01-discovery/target-audience.md` for the user model, pain points, and positioning
- `docs/adr/` when it exists for architecture or workflow decisions

If any of these files do not exist, proceed silently. Do not block work just because the documentation has not been formalized yet.

## Current domain focus

Skills should assume the primary product problem is:

- Help small e-commerce sellers turn white-background product images into better scene images
- Evolve that workflow into full detail-page generation
- Optimize for low-skill, low-cost, fast-turnaround usage by Taobao, Douyin, and 1688 sellers

## Vocabulary guidance

Prefer the product language already used in this repo:

- `scene generation`
- `detail-page generation`
- `white-background product image`
- `gallery case`
- `small seller`
- `operator`
- `conversion`

Avoid drifting into generic "creative AI platform" language unless the current docs explicitly broaden the scope.

## ADR guidance

If a future ADR in `docs/adr/` conflicts with a proposed implementation, surface the conflict explicitly instead of silently overriding it.

# Define Backend MVP API Contract

Status: ready-for-human
Owner: unassigned
Related: `server.js`, `PRD.md`, `CONTEXT.md`, `.scratch/detail-page-generation/PRD.md`

## Problem

Backend work should start soon, but only after the front-end workflow is clear enough to avoid immediate rework.

## Goal

Define the minimal API contract needed to support the current and next-step detail-page workflow.

## Scope

- describe request and response shapes
- define the smallest useful endpoints
- align the contract with the current front-end flow

## Candidate Endpoints

- `POST /api/generate-scene-fusion`
- `POST /api/detail/generate`
- `GET /api/detail/jobs/:id`
- `GET /api/history`

## Questions To Resolve

- should detail generation be synchronous for demo mode and async for MVP?
- what is the minimal response shape for first-screen confirmation?
- how should long-running generation progress be reported?
- what result objects should be stored for local history?

## Acceptance Criteria

- the endpoint list is explicit
- each endpoint has a request shape and response shape
- the contract clearly supports first-screen confirmation plus full detail-page generation
- the document is good enough for implementation planning

## Notes

Do not overdesign. This is a minimum viable contract, not a final production architecture.

## Comments

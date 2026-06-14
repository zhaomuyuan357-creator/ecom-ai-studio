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
- `docs/product-backbone-phase-plan.md`
- `docs/product-backbone-implementation-split.md`
- `docs/adr/0001-product-backbone-db-stack.md`

Suggested resume prompt:

```text
先读 AGENTS.md、CONTEXT.md、PROGRESS.md、docs/current-handoff.md、docs/detail-page-upgrade-optimization-plan.md、docs/detail-page-generation-step-plan.md、docs/detail-page-generation-step-05-confirmation-panel.md、docs/detail-page-generation-step-06-hero-generation.md、docs/product-backbone-phase-plan.md、docs/product-backbone-implementation-split.md、docs/adr/0001-product-backbone-db-stack.md，然后继续当前项目。

当前基线：
1. 活跃根目录是 D:\ECONY，不是旧的 ecom-ai-studio 子目录
2. 当前线上预览目标仍然是 http://localhost:3000/
3. 详情页主工作流仍然停留在 Step 7，不能跳过模块规划层直接做整套批量详情页
4. 当前详情页规则仍然是：用户资料定事实、参考图定版式、首图定基调、AI 受控发挥
5. docs/detail-page-upgrade-optimization-plan.md 的 Phase 1-5 还没有全部浏览器验收关闭
6. 与此同时，新开了产品骨架闭环阶段，第一版数据库固定为 SQLite，ORM 固定为 Prisma，架构固定为 Route -> Service -> Repository -> Prisma
7. Prisma 6.9.0 已经装通，prisma generate 和 prisma migrate dev --name init_product_backbone 已跑通
8. 新增的后端骨架代码已经落地到 prisma/ 和 src/，当前是“已建骨架、未接入现有 server.js、未做接口烟测”的状态
9. 当前不要去大范围改 public/index.html 或重构旧流程，要优先用增量方式把后端骨架接到现有服务里
10. 下一步优先级：补 .env 的 DATABASE_URL -> 最小接入新路由 -> 本地烟测 auth/me/assets/tasks 接口 -> 再决定是否提交和推送
```

## Project Snapshot

- Project: `Ecom AI Studio`
- Active workspace: `D:\ECONY`
- Active preview target: `http://localhost:3000/`
- Branch: `codex/deploy-render-prep`
- Product direction:
  - existing workflow track: ecommerce image/detail-page generation
  - new backbone track: login, persistence, ownership, and future credits foundation

## Whole Project Judgment

- The detail-page workflow direction is clear, but Phase 1-5 are still not fully browser-accepted.
- A second parallel track has now started: `产品骨架闭环阶段`.
- Current highest-value backend work is no longer brainstorming. The first executable skeleton already exists.
- The immediate focus is to connect that skeleton safely without destabilizing the accepted localhost:3000 surface.

## Current Dual-Track Status

### Track A: Detail-page workflow

- Step 5 summary confirmation exists
- Step 6 hero generation exists
- Step 7 planner/workbench exists
- `统一导出详情页` early assembly area exists
- Phase 1-5 are not fully closed at browser-acceptance level
- `public/index.html` still has historical script corruption and duplicate layers

### Track B: Product backbone

- Stage defined:
  - `docs/product-backbone-phase-plan.md`
  - `docs/product-backbone-implementation-split.md`
  - `docs/adr/0001-product-backbone-db-stack.md`
- Stack fixed for V1:
  - DB: `SQLite`
  - ORM: `Prisma`
  - app layering: `Route -> Service -> Repository -> Prisma`
  - future migration target: `PostgreSQL`
- Status:
  - schema landed
  - migration landed
  - service/repository/route skeleton landed
  - not yet mounted into the live app entry
  - not yet smoke-tested end to end

## What Has Been Completed In The Backbone Track

### 1. Dependency and environment preparation

- `package.json` now includes Prisma scripts and dependencies
- `.env.example` now includes `DATABASE_URL="file:./dev.db"`
- `Prisma 6.9.0` path was verified as installable in this repo

### 2. Prisma baseline

- `prisma/schema.prisma` created
- `prisma generate` succeeded
- `prisma migrate dev --name init_product_backbone` succeeded with temporary env var
- migration files were generated under `prisma/migrations/`

### 3. Backend layering skeleton

Added:

- `src/app.js`
- `src/lib/prisma.js`
- `src/routes/auth.routes.js`
- `src/routes/me.routes.js`
- `src/routes/assets.routes.js`
- `src/routes/tasks.routes.js`
- `src/services/auth.service.js`
- `src/services/user.service.js`
- `src/services/asset.service.js`
- `src/services/task.service.js`
- `src/repositories/user.repository.js`
- `src/repositories/auth-code.repository.js`
- `src/repositories/asset.repository.js`
- `src/repositories/task.repository.js`
- `src/repositories/result.repository.js`

### 4. Syntax verification

- `node --check` passed on the new `src/**/*.js` files

## Important Current Reality

- The new backend skeleton is additive work. It does not replace the accepted detail-page workflow.
- Do not broaden into large refactors.
- Do not destabilize `public/index.html` unless a bug requires it.
- Do not move business logic directly into routes or Prisma calls directly into services.

## Open Risks

- `public/index.html` still contains legacy corruption and duplicate logic layers
- real `.env` still appears to be missing `DATABASE_URL`
- new Prisma/backend skeleton is not yet mounted into the live server entry
- new auth/me/assets/tasks routes are not yet smoke-tested through the running app
- there are unrelated untracked files under `.scratch/` and docs that should not be staged accidentally

## Current Git Snapshot

Modified:

- `.gitignore`
- `package-lock.json`
- `package.json`

Untracked but relevant:

- `.env.example`
- `docs/product-backbone-phase-plan.md`
- `docs/product-backbone-implementation-split.md`
- `docs/adr/0001-product-backbone-db-stack.md`
- `prisma/`
- `src/`

Untracked and unrelated:

- `.scratch/...`
- `docs/ECONY-module-blueprint-2026-06-13.md`

## Recommended Next Steps

### Priority 1

Safely complete the backend baseline wiring:

1. add `DATABASE_URL=file:./dev.db` into the real `.env` without disturbing existing secrets
2. minimally mount the new route layer into the current app/server entry
3. keep this integration additive rather than replacing old logic

### Priority 2

Run local smoke tests for the first backend slice:

- `POST /api/auth/send-code`
- `POST /api/auth/login`
- `GET /api/me`
- `POST /api/assets`
- `POST /api/tasks`
- `GET /api/tasks/:id`

### Priority 3

After the backend slice is locally stable:

- decide whether to commit the backbone skeleton as a clean checkpoint
- then resume browser acceptance on the detail-page workflow track


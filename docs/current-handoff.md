# Current Handoff

## Read First

Start the next conversation by reading:

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

## Current Product State

- Project: `Ecom AI Studio`
- Active workspace: `D:\ECONY`
- Active preview target: `http://localhost:3000/`
- Active branch: `codex/deploy-render-prep`

There are now two parallel tracks:

1. existing detail-page workflow track
2. new product-backbone track

The new track does not replace the old one.

## Track A: Detail-page Workflow

### Still true

- The workflow must remain:
  1. confirm summary
  2. generate hero
  3. confirm hero
  4. enter module planning
  5. classify references
  6. supplement facts
  7. generate modules one by one
  8. assemble/export detail page
- Do not skip the Step 7 planning layer.
- Existing priority rules still apply:
  - user facts define content truth
  - reference images define layout and composition
  - approved hero image defines style baseline
  - AI can only do controlled extension

### Status judgment

- Phase 1-5 are still not fully browser-accepted.
- `public/index.html` still has legacy corruption and duplicate layers.
- Do not reopen broad cleanup here while the backbone work is being connected.

## Track B: Product Backbone

### Stage decision already made

This is now documented in:

- `docs/product-backbone-phase-plan.md`
- `docs/product-backbone-implementation-split.md`
- `docs/adr/0001-product-backbone-db-stack.md`

### Fixed technical choice

- first database: `SQLite`
- ORM: `Prisma`
- layering: `Route -> Service -> Repository -> Prisma`
- future migration target: `PostgreSQL`

### What already landed

- Prisma dependencies added to `package.json`
- `.env.example` added with `DATABASE_URL="file:./dev.db"`
- `prisma/schema.prisma` created
- Prisma migration files created
- backend skeleton created under `src/`

New code areas:

- `src/app.js`
- `src/lib/prisma.js`
- `src/routes/`
- `src/services/`
- `src/repositories/`
- `prisma/`

### What was already verified

- `Prisma 6.9.0` is the working version path in this repo
- `prisma generate` succeeded
- `prisma migrate dev --name init_product_backbone` succeeded using a temporary `DATABASE_URL`
- `node --check` passed on the new `src/**/*.js` files

## Current Real Blockers

1. the real `.env` still appears to be missing `DATABASE_URL`
2. the new backend skeleton is not yet mounted into the live app entry
3. the new auth/me/assets/tasks endpoints have not yet been smoke-tested through the running app

## Important Boundaries

- Keep changes additive.
- Do not destabilize the accepted localhost:3000 flow.
- Do not do broad refactors inside `public/index.html`.
- Keep repository and service responsibilities separated.
- If a multi-table atomic flow is needed, open the transaction in the service layer.

## Recommended Next Step

Continue from the backbone track first:

1. add `DATABASE_URL=file:./dev.db` into the real `.env` carefully
2. minimally wire the new route layer into the current server entry
3. smoke-test:
   - `POST /api/auth/send-code`
   - `POST /api/auth/login`
   - `GET /api/me`
   - `POST /api/assets`
   - `POST /api/tasks`
   - `GET /api/tasks/:id`
4. only after that, decide whether to commit/push this backend checkpoint

## Suggested Resume Prompt

```text
先读 AGENTS.md、CONTEXT.md、PROGRESS.md、docs/current-handoff.md、docs/detail-page-upgrade-optimization-plan.md、docs/detail-page-generation-step-plan.md、docs/detail-page-generation-step-05-confirmation-panel.md、docs/detail-page-generation-step-06-hero-generation.md、docs/product-backbone-phase-plan.md、docs/product-backbone-implementation-split.md、docs/adr/0001-product-backbone-db-stack.md，然后继续当前项目。

当前基线：
1. 活跃根目录是 D:\ECONY，预览目标还是 http://localhost:3000/
2. 详情页主工作流仍然保持 Step 7 结构，不能跳过模块规划层直接批量生成整套详情页
3. 详情页规则不变：用户资料定事实、参考图定版式、首图定基调、AI 受控发挥
4. Phase 1-5 的详情页能力还没有完成整体验收关闭，public/index.html 也仍然有历史层和局部腐坏
5. 但当前新开的“产品骨架闭环阶段”已经进入实现态，不再只是文档阶段
6. 第一版数据库固定为 SQLite，ORM 固定为 Prisma，架构固定为 Route -> Service -> Repository -> Prisma，未来再切 PostgreSQL
7. Prisma 6.9.0 已装通，prisma generate 和 prisma migrate dev --name init_product_backbone 已成功
8. prisma/ 和 src/ 下的新后端骨架已经落地，但还没正式接入现有 server，也还没做接口烟测
9. 当前不要大改旧前端流程，优先做最小接入：补 .env 的 DATABASE_URL、挂载新路由、跑 auth/me/assets/tasks 烟测
10. 这轮目标是先把产品骨架第一段接通，再决定是否提交和推送，然后再回到详情页链路验收
```

# ADR 0001: 产品骨架阶段数据库技术路线

## 状态

Accepted

## 日期

2026-06-13

## 背景

项目当前服务端主栈是：

- `Node.js`
- `Express`

当前正在进入 `产品骨架闭环阶段`，需要开始引入：

1. 用户体系
2. 数据持久化
3. “我的”模块
4. 后续额度与充值的结构预留

此时必须先固定数据库技术路线，否则后面会反复摇摆在：

- SQLite 还是 PostgreSQL
- Prisma 还是 SQLAlchemy
- 数据库逻辑直接写在业务里，还是先做分层

## 决策

本阶段采用以下方案：

1. 第一版数据库使用 `SQLite`
2. ORM 使用 `Prisma`
3. 数据访问层与业务逻辑层解耦
4. 后续数据库升级目标为 `PostgreSQL`

补充约束：

1. 当前 `Prisma` 已支持在 `SQLite` 下使用 `Enum` 和 `Json`
2. 第一版允许为工作流快照类字段使用 `Json`
3. 不把 `String[]` 标量列表作为默认核心建模方式
4. 多表事务边界统一由 `Service` 层发起

## 为什么这样选

### 选择 SQLite

原因：

1. 第一版目标是快速形成可运行闭环
2. 本地开发和早期部署更轻
3. 更适合先把“用户-任务-作品-素材”结构跑起来

### 选择 Prisma

原因：

1. 当前后端是 Node 项目
2. Prisma 和 Express 集成自然
3. 类型、schema、migration 体验更适合当前栈
4. 后续切 PostgreSQL 时迁移路径更清晰

### 不选择 SQLAlchemy

原因：

1. SQLAlchemy 属于 Python 侧主流 ORM
2. 当前项目不是 Python 服务端主栈
3. 会引入新的运行时、依赖体系和维护复杂度

## 分层要求

必须拆分为：

1. Route Layer
2. Service Layer
3. Repository Layer
4. Prisma / DB Layer

要求：

1. Route 不直接写数据库查询
2. Service 不直接依赖具体数据库类型
3. Repository 统一封装 Prisma 访问
4. 未来切 PostgreSQL 时，尽量只动 DB 配置、schema 和 migration
5. 涉及多表原子操作时，由 Service 层持有并传递事务上下文

## 结果

这项决策意味着：

1. 第一版可以用 SQLite 快速起步
2. 不会把数据库逻辑继续堆进 `server.js`
3. 后续升级 PostgreSQL 时不会推倒业务层重写

## 当前执行含义

接下来开发数据库骨架时，应默认：

1. 先建 `prisma/schema.prisma`
2. 再建 `src/lib/prisma.js`
3. 再建 Repository 层
4. 再让 Service 层逐步接入

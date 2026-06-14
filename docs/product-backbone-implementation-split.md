# 产品骨架实施拆解

## 目标

把 `产品骨架闭环阶段` 拆成真正能开工的最小单元。

这份文档只回答三件事：

1. 要建哪些表
2. 要先做哪些接口
3. “我的”页面第一版放什么

---

## 设计原则

1. 先做最小闭环，不做大而全
2. 先保证数据能存、能查、能归属
3. 先让“我的”看起来像产品，不像空壳
4. 充值先预留结构，不先做完整商业系统
5. 数据访问层和业务逻辑层必须解耦

---

## 技术路线固定

本阶段先固定以下方案：

1. 数据库：`SQLite`
2. ORM：`Prisma`
3. 后续迁移目标：`PostgreSQL`

不采用 `SQLAlchemy`，因为当前服务端主栈是 `Node.js + Express`，引入 Python ORM 会让部署、运行时和维护成本上升。

补充说明：

1. 当前 `Prisma` 已支持 `SQLite` 下的 `Enum` 和 `Json`
2. 因此第一版可以合理使用 `Prisma enum` 和 `Json`
3. 但 `String[]` 这类标量列表不应作为核心通用建模手段

---

## 分层要求

必须至少拆成下面四层：

### 1. Route Layer

职责：

- 接收 HTTP 请求
- 做基础参数校验
- 调用 Service
- 返回统一 JSON

建议目录：

- `src/routes/`

---

### 2. Service Layer

职责：

- 承接业务逻辑
- 编排任务创建、素材入库、用户归属
- 不直接写 SQL
- 不直接依赖具体数据库类型

建议目录：

- `src/services/`

---

### 3. Repository Layer

职责：

- 封装 Prisma 查询
- 对上提供清晰的数据访问接口
- 保证以后从 SQLite 切 PostgreSQL 时，上层尽量不改

建议目录：

- `src/repositories/`

---

### 4. DB / Prisma Layer

职责：

- 维护 Prisma Client
- 管理 schema
- 管理 migrations

建议目录：

- `prisma/schema.prisma`
- `src/lib/prisma.js`

---

## 推荐目录结构

第一版建议逐步收敛到：

```text
src/
  app.js
  routes/
    auth.routes.js
    me.routes.js
    assets.routes.js
    tasks.routes.js
  services/
    auth.service.js
    user.service.js
    asset.service.js
    task.service.js
    workspace.service.js
    wallet.service.js
  repositories/
    user.repository.js
    auth-code.repository.js
    asset.repository.js
    task.repository.js
    result.repository.js
    workspace.repository.js
    workspace-module.repository.js
    wallet.repository.js
  lib/
    prisma.js
  utils/
    response.js
    errors.js

prisma/
  schema.prisma
  migrations/
```

当前的 `server.js` 可以先继续作为入口，但后续要逐步变薄，只保留：

1. app 初始化
2. 中间件挂载
3. route 注册
4. 启动逻辑

---

## 一、数据库表

### 1. users

用户主表。

建议字段：

- `id`
- `email`
- `phone`
- `nickname`
- `avatar_url`
- `login_type`
- `status`
- `created_at`
- `updated_at`

Prisma 建议：

- `id` 使用 `String @id @default(cuid())`
- `email` 和 `phone` 允许先 nullable
- `email` / `phone` 后续按登录方式加唯一约束

用途：

- 标识用户身份
- 作为所有生成内容的归属主体

---

### 2. auth_codes

验证码表。

建议字段：

- `id`
- `target`
- `code_hash`
- `scene`
- `expires_at`
- `used_at`
- `created_at`

用途：

- 邮箱 / 手机验证码登录
- 记录验证码发送与使用状态

---

### 3. media_assets

素材表。

建议字段：

- `id`
- `user_id`
- `asset_type`
- `source_name`
- `storage_url`
- `mime_type`
- `file_size`
- `width`
- `height`
- `created_at`

Prisma 建议：

- `user_id` 用 relation 连接 `users`
- `storage_url` 先支持本地或对象存储 URL
- `asset_type` 用 enum

`asset_type` 建议包括：

- `scene_source`
- `detail_product`
- `detail_reference`
- `result_image`
- `hero_image`

用途：

- 统一保存上传图和结果图
- 后面“我的素材”直接从这里来

---

### 4. generation_tasks

生成任务主表。

建议字段：

- `id`
- `user_id`
- `task_type`
- `task_status`
- `input_payload`
- `result_payload`
- `source_asset_id`
- `created_at`
- `updated_at`

Prisma 建议：

- `task_type` 和 `task_status` 使用 enum
- `input_payload` / `result_payload` 第一版可先用 `Json`
- `source_asset_id` 后续允许扩展成多素材关系

建模提醒：

- 如果未来要支持一个任务关联多张素材，优先补关系表
- 不把 `String[] assetIds` 当成默认主方案

`task_type` 建议包括：

- `scene`
- `detail_hero`
- `detail_module`
- `detail_page`

`task_status` 建议包括：

- `pending`
- `running`
- `success`
- `failed`
- `canceled`

用途：

- 保存每次生成记录
- 支撑“我的任务”和“最近生成”

---

### 5. generation_results

生成结果表。

建议字段：

- `id`
- `task_id`
- `asset_id`
- `result_kind`
- `display_name`
- `created_at`

用途：

- 一个任务可能有多个结果
- 支撑“结果图”“作品图”“版本图”

---

### 6. detail_workspaces

详情页工作台表。

建议字段：

- `id`
- `user_id`
- `project_name`
- `summary_payload`
- `hero_payload`
- `module_plan_payload`
- `assembly_payload`
- `current_step`
- `status`
- `created_at`
- `updated_at`

Prisma 建议：

- `summary_payload` / `hero_payload` / `module_plan_payload` / `assembly_payload` 第一版先用 `Json`
- `current_step` 用字符串枚举保存

建模提醒：

- 这类字段属于工作流快照，第一版适合先放 `Json`
- 等结构稳定后，再决定是否进一步拆成更细的实体表

用途：

- 存详情页工作流的阶段状态
- 让用户下次回来还能继续做

---

### 7. detail_workspace_modules

详情页模块表。

建议字段：

- `id`
- `workspace_id`
- `module_key`
- `module_label`
- `module_status`
- `supplemental_payload`
- `generated_payload`
- `reference_asset_ids`
- `created_at`
- `updated_at`

用途：

- 保存单模块生成与补充内容
- 支撑 Step 7 的单模块工作流

---

### 8. wallet_accounts

钱包/额度账户表。

建议字段：

- `id`
- `user_id`
- `balance`
- `free_balance`
- `paid_balance`
- `updated_at`

用途：

- 先把额度结构预埋
- 为未来充值和扣费做准备

---

### 9. wallet_transactions

额度流水表。

建议字段：

- `id`
- `user_id`
- `direction`
- `amount`
- `reason`
- `source_type`
- `source_id`
- `created_at`

用途：

- 记录充值、消耗、返还
- 方便后面对账和补偿

---

## Prisma Schema 要求

第一版 schema 要求：

1. 所有主键统一风格
2. 所有时间字段统一有 `created_at` / `updated_at`
3. 枚举字段优先用 Prisma enum
4. 复杂工作流状态先用 `Json`，不要第一版过度规范化
5. 所有外键关系必须在 Prisma schema 里显式声明
6. 不把 `String[]` 作为核心业务字段默认方案

---

## 事务边界要求

这一条必须提前固定：

1. 单表读写由 Repository 封装
2. 涉及多表原子操作时，由 Service 层开启事务
3. Repository 不自己决定事务边界

推荐方式：

1. Service 层调用 `prisma.$transaction(async (tx) => { ... })`
2. 把 `tx` 作为参数传给 Repository 方法
3. Repository 同时支持接收 `prisma` 或 `tx`

典型需要事务的场景：

1. 创建任务同时写入素材关联
2. 创建用户同时初始化钱包
3. 任务成功后同时写结果表和任务状态

---

## SQLite 到 PostgreSQL 的迁移约束

为了后续平滑切换，第一版现在就要遵守这些约束：

1. 业务层不能直接写 Prisma 查询
2. 路由层不能直接碰 Repository
3. 不在业务逻辑里写 SQLite 方言
4. 不依赖 SQLite 私有行为来完成核心逻辑
5. 尽量使用 Prisma 支持的通用类型和查询方式

这意味着将来切到 PostgreSQL 时，主要变化应集中在：

1. `DATABASE_URL`
2. Prisma migration
3. 少量 schema 类型调整

而不应该大面积改：

1. Route
2. Service
3. 业务流程

---

## 二、接口优先级

### 第一批必须先做

#### 1. `POST /api/auth/send-code`

发送验证码。

输入：

- `target`
- `scene`

输出：

- 是否发送成功

---

#### 2. `POST /api/auth/login`

验证码登录。

输入：

- `target`
- `code`

输出：

- `user`
- `token`

---

#### 3. `GET /api/me`

获取当前用户信息。

输出：

- 用户基础资料
- 当前额度

---

#### 4. `GET /api/me/projects`

我的作品 / 我的任务 / 最近生成。

输出：

- 项目列表
- 任务列表
- 最近记录

---

#### 5. `POST /api/assets/upload`

上传素材。

输入：

- `file`
- `assetType`

输出：

- `assetId`
- `url`
- `previewUrl`

---

#### 6. `POST /api/tasks/create`

创建生成任务。

输入：

- `taskType`
- `inputPayload`
- `sourceAssetIds`

输出：

- `taskId`

---

#### 7. `GET /api/tasks/:id`

查单个任务状态和结果。

输出：

- 任务状态
- 结果列表
- 可继续动作

---

### 第二批再做

#### 8. `POST /api/wallet/recharge`

充值预留接口。

#### 9. `POST /api/wallet/consume`

扣减额度接口。

#### 10. `POST /api/wallet/refund`

失败返还接口。

---

## 三、“我的”页面第一版

### 结构

第一版建议只放四块：

1. 我的作品
2. 我的任务
3. 最近生成
4. 我的素材

---

### 1. 我的作品

展示内容：

- 封面图
- 名称
- 类型
- 更新时间

点击后进入详情。

---

### 2. 我的任务

展示内容：

- 任务类型
- 任务状态
- 创建时间
- 进度感

用途：

- 让用户知道系统在干什么
- 方便看失败和重试

---

### 3. 最近生成

展示内容：

- 最近 6 到 12 条结果
- 场景图 / 首图 / 模块图标签
- 下载入口

用途：

- 提供最直接的成果感

---

### 4. 我的素材

展示内容：

- 商品白底图
- 参考图
- 历史结果图

用途：

- 后面做复用
- 后面做继续生成

---

## 四、第一版页面骨架

建议第一版“我的”做成三栏或卡片式：

1. 顶部用户信息
2. 中间四个内容区
3. 右侧或顶部一个额度信息条

### 顶部用户信息

- 头像
- 昵称
- 登录方式
- 当前额度

### 额度条

- 剩余额度
- 已用额度
- 去充值按钮

---

## 五、最小闭环验收

这一轮完成时，至少要满足：

1. 用户登录后能看到自己的内容
2. 生成记录能持久保存
3. “我的”里能看到任务和作品
4. 素材和结果能复用
5. 后续接充值时不需要重做结构

---

## 六、建议开工顺序

1. 先建 `users` / `auth_codes`
2. 再建 `media_assets`
3. 再建 `generation_tasks` / `generation_results`
4. 再建 `detail_workspaces` / `detail_workspace_modules`
5. 最后补 `wallet_accounts` / `wallet_transactions`
6. 同时先把“我的”页面做第一版

---

## 七、当前结论

这不是重做产品。

这是把现有工作流产品，补成一个真正可以沉淀用户数据的产品。

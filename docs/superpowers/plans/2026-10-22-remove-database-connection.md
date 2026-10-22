# naruto-spiritism 数据库连接配置移除计划

> **For agentic workers:** 使用 superpowers:executing-plans 在当前会话逐项执行，不默认委派子代理。以下复选框用于记录执行状态。

**Goal:** 项目彻底移除 PostgreSQL 连接串及其脚本依赖，数据库维护改由 Supabase 控制台完成，应用继续只依赖公开 URL 和 Publishable Key。

**Architecture:** 保留浏览器 Supabase SDK、用户 JWT、RLS 和现有业务 RPC。删除直连数据库管理通道，将需要 SQL 权限的维护工作改成控制台操作。保留公开 API 检查、PGlite 数据库测试和离线类型生成，不新增没有消费者的 Secret Key。

**Tech Stack:** Nuxt 4、Supabase JS、PostgreSQL RPC/RLS、PGlite、Vitest、Yarn。

**Spec:** 本次会话中用户选择“整个项目彻底移除，数据库维护改用 Supabase 控制台”；随后确认无需为当前功能引入 `SUPABASE_SECRET_KEY`。本地实施已完成，线上操作状态见文末。

## Global Constraints

- 不新增 `SUPABASE_SECRET_KEY`，不保留数据库连接串的别名或兼容分支。
- 不修改现有用户登录、业务 RPC、RLS、业务数据或其他应用 schema。
- 已应用的 `supabase/migrations/*.sql` 不改写、不重新执行。
- 不将单连接控制台 SQL 或 PGlite 测试描述为已验证真实云端双连接并发锁。
- 实施、提交和线上变量删除分别报告实际完成情况。
- 不读取或输出实际密钥。计划不需要新建服务端接口或万能 SQL RPC。

## 实施前事实

- `app/plugins/dojo.client.ts` 通过 `get_catalog`、`get_my_state`、`record_cast`、`select_companion` RPC 操作数据；用户身份来自 Supabase Auth。
- `DIRECT_DATABASE_URL` 仅由 `scripts/database-client.ts` 使用，依赖方为数据库迁移、schema 暴露、状态检查和云端核验脚本。
- `scripts/db-generate.ts` 和 `tests/unit/database.test.ts` 使用本地 PGlite，不依赖云端连接串。
- `scripts/auth-configure.ts` 使用独立的 Management API Token；它不属于本次数据库连接删除的必要范围。
- `package.json` 的应用 build 不执行数据库迁移。此结论尚未核对 Vercel 控制台中的自定义命令。

## Task 1：保留不需要管理凭据的云端检查

**Files:** 修改 `scripts/db-status.ts`、`scripts/db-verify.ts`；新增 `scripts/public-api-checks.ts`、`tests/unit/public-api-checks.test.ts`。

**Interfaces:** 公共检查函数接收 `url: string`、`key: string` 和可替换的 `fetch` 实现；状态检查返回 Auth/GitHub 和目录结果，验证函数在目录或游客权限不符时抛错。脚本负责读取两个公开环境变量、打印结果和设置失败退出码。

- [x] 测试先覆盖成功目录（12 印、28 忍术、25 忍者）、HTTP 错误、GitHub 未启用、游客调用私有 RPC 被拒、游客意外获得私有 RPC 权限时失败。
- [x] 运行 `yarn test tests/unit/public-api-checks.test.ts`，确认新增行为测试先失败。
- [x] 提取现有公开 HTTP 检查到新模块，保持 `apikey` 与 `Content-Profile: naruto_spiritism` 的使用方式；不把公开 Key 当作用户 JWT。
- [x] 从 `db-status.ts` 删除数据库连接与数据库内部配置检查；从 `db-verify.ts` 删除内部 SQL 检查，保留现有目录精确比较和游客 RPC 拒绝检查。
- [x] 运行针对性测试，检查超时、非 JSON 错误响应以及明确的失败退出码。更新命令说明，避免把公开 API 检查称为完整云端数据库权限审计。

## Task 2：以控制台维护取代数据库连接脚本

**Files:** 删除 `scripts/database-client.ts`、`scripts/database-ca.ts`、`scripts/db-download-ca.ts`、`scripts/db-migrate.ts`、`scripts/db-expose.ts`、`scripts/db-verify-transactions.ts`；修改 `package.json`、`yarn.lock`、`.env.example`、`README.md`、`docs/supabase.md`；新增 `supabase/maintenance/verify-permissions.sql`、`docs/database-console.md`。

**Interfaces:** `yarn db:status` 和 `yarn db:verify` 仅使用公开配置；`yarn db:generate` 继续在 PGlite 运行；不再提供 `db:migrate`、`db:expose`、`db:verify-transactions` 命令。

- [x] 将 `db-verify.ts` 中读取表 RLS、角色权限、函数权限及固定 search_path 的 SQL 转为 SQL Editor 可运行的只读核验文件，包裹 `begin read only` 与 `rollback`，输出核验结果；不创建额外公开函数。
- [x] 编写控制台手册：先确认目标 YQYHub 项目和迁移账本；只执行尚未应用的新 SQL；迁移使用显式事务和现有 checksum 账本规则；执行后核验并记录迁移名与 checksum。现有两份历史迁移不因此次清理重新执行。
- [x] 手册说明 Data API 设置仅追加 `naruto_spiritism`，保留其他 exposed schemas；回调配置可在 Auth URL Configuration 中追加本应用地址。
- [x] 删除上述数据库连接脚本和三个对应命令，移除直接依赖 `pg`、`@types/pg`，通过 Yarn 更新锁文件；PGlite 与 Supabase SDK 保留。
- [x] 从 `.env.example` 移除 `DIRECT_DATABASE_URL`、`SUPABASE_DB_CA_PATH`；不添加 Secret Key。Management API 的 `SUPABASE_ACCESS_TOKEN`、`APP_ORIGINS` 和 `auth:configure` 暂保留为可选独立工具，不注入 Vercel 应用。
- [x] 更新文档，明确原云端双连接并发、真实用户回滚测试已退出自动化工具集；本地测试与控制台只读检查不能替代这些验证。

## Task 3：验证与部署配置清理

- [x] 运行 `yarn test`、`yarn typecheck`、`yarn lint`、`yarn format:check`、`yarn build`；检查 `yarn db:generate` 仍能生成预期类型且无非预期差异。
- [x] 检查 `git diff --check` 和完整 diff；确认没有新增高权限服务端通道或修改历史迁移。
- [x] 全仓扫描数据库连接变量、`databaseClient`、`databaseCaPath` 及 `pg` 直接导入；运行代码、配置示例、命令和锁文件中不应残留失效依赖。
- [x] 清理本地忽略文件 `.env` 中的数据库连接、CA 路径配置，不输出值；不存在完整 Secret Key 时不从截图推断。
- [ ] 确认 Vercel `ninja-signs` 是否对应此仓库，检查 Build/Install Command 无管理脚本调用后，移除该项目关联的数据库连接变量；不删除其他应用的团队 Shared 关联。
- [ ] Vercel 运行配置保留 `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`；不用新增 `SUPABASE_SECRET_KEY`。检查同名项目变量与 Shared 覆盖关系，然后重新部署。
- [ ] 使用公开 API 检查和真实账号验证目录、登录回调、个人进度、施术重试、伙伴选择；需要真人登录/摄像头时由用户参与，不把未完成的云端验证写成通过。
- [x] 用户已要求提交；未找到指定规范文件，已说明并采用仓库现有格式。提交与推送分别处理。

## 用户需要参与的操作

- Supabase SQL Editor 的数据库维护，以及缺少平台权限时的 Vercel 配置删除和重新部署。
- 使用真实账号进行上线后体验；当前新建的 `naruto` Secret Key 无需配置到应用。

## 完成标准

项目无需 PostgreSQL 连接环境变量即可安装、开发、测试、类型生成和构建。日常云端检查只使用公开 Key；数据库结构维护走控制台；没有新增无用途的 Secret Key、旧连接兼容代码或万能 SQL API。线上配置清理和上线体验的完成情况单独列明。

## 2026-10-22 执行记录

- 本地实现完成：删除 6 个直连/证书/维护脚本、3 个命令及 `pg` / `@types/pg` 依赖；通过 Yarn 更新锁文件，无旧变量兼容分支。
- 公开 API 检查和 SQL Editor 权限核验均有测试；全部 10 个测试文件、96 个测试通过。ESLint、Nuxt 与脚本 TypeScript 检查、Prettier、生产构建、`git diff --check` 通过。离线类型生成成功且生成文件无差异。
- 已扫描运行代码、示例和锁文件，无数据库连接变量或旧脚本依赖残留；历史迁移未改动。本地忽略文件中相关连接变量已清理。
- 本地 `.env` 未配置两个公开变量，公开云端检查因此尚未执行。构建成功，但有 Supabase 公开配置缺失提示，不等于线上功能验收通过。
- Vercel 团队访问返回 403，尚未核实 `ninja-signs` 仓库映射、自定义命令、Shared 覆盖或删除线上变量，也未重新部署。需获得对应团队访问后执行，或用户按控制台维护手册操作。
- SQL Editor 云端核验、真实账号登录与业务验收尚未执行。本次无需对现有生产数据库执行迁移。
- 用户已要求提交本地改动；采用仓库现有的 `类型: 中文说明` 格式，不包含推送或部署。
